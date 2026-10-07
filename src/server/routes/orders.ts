import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { getUserFromToken } from './auth.ts';
import { getProductWholesalePrice, validateVoucher, SHIPPING_METHODS } from '../pricing.ts';
import { broadcastRealtimeEvent } from '../sse.ts';

export const ordersRouter = Router();

// Shipping methods list
ordersRouter.get('/checkout/shipping-methods', (_req: Request, res: Response) => {
  res.json({ methods: SHIPPING_METHODS });
});

// Validate Voucher
ordersRouter.post('/checkout/validate-voucher', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  const result = validateVoucher(code, Number(subtotal || 0));
  if (!result.valid) {
    return res.status(400).json({ error: result.error, discount: 0 });
  }
  res.json({
    valid: true,
    code: result.voucher.code,
    description: result.voucher.description,
    discount: result.discount
  });
});

// Create Order (Database Transaction with Atomic Stock Reservation)
ordersRouter.post('/checkout/create-order', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  const sessionId = req.headers['x-session-id'] as string;
  const {
    recipient_name,
    recipient_phone,
    shipping_address,
    shipping_city,
    shipping_province,
    shipping_postal,
    shipping_method_id,
    payment_method,
    voucher_code,
    notes
  } = req.body;

  if (!recipient_name || !recipient_phone || !shipping_address || !shipping_city) {
    return res.status(400).json({ error: 'Data penerima dan alamat pengiriman wajib diisi' });
  }

  const shippingOption = SHIPPING_METHODS.find(m => m.id === shipping_method_id) || SHIPPING_METHODS[0];

  // Retrieve user's cart
  let cart = user ? db.prepare('SELECT id FROM carts WHERE user_id = ?').get(user.id) as any
                  : db.prepare('SELECT id FROM carts WHERE session_id = ?').get(sessionId || 'guest_default_session') as any;

  if (!cart) {
    return res.status(400).json({ error: 'Keranjang belanja Anda kosong' });
  }

  // Get selected cart items
  const cartItems = db.prepare(`
    SELECT ci.*, p.name as product_name, p.normal_price, p.promo_price,
           pv.title as variant_title, pv.sku as variant_sku, pv.additional_price,
           pv.available_stock, pv.current_stock,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ? AND ci.is_selected = 1
  `).all(cart.id) as any[];

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Tidak ada item terpilih di keranjang' });
  }

  // Execute ACID Transaction
  const executeOrderTx = db.transaction(() => {
    let subtotal = 0;
    let wholesaleDiscountTotal = 0;
    const validatedItems: any[] = [];

    // 1. Validate Stock & Calculate Tiered Prices for every item
    for (const item of cartItems) {
      // Re-read variant stock under transaction lock to prevent overselling
      const variant = db.prepare('SELECT available_stock, current_stock, reserved_stock FROM product_variants WHERE id = ?').get(item.variant_id) as any;

      if (!variant || variant.available_stock < item.quantity) {
        throw new Error(`Stok untuk produk "${item.product_name} (${item.variant_title})" tidak mencukupi (Tersedia: ${variant?.available_stock || 0}).`);
      }

      const basePrice = (item.promo_price || item.normal_price) + (item.additional_price || 0);
      const { unitPrice, savingsPerUnit } = getProductWholesalePrice(item.product_id, basePrice, item.quantity);
      
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      wholesaleDiscountTotal += (savingsPerUnit * item.quantity);

      validatedItems.push({
        ...item,
        unitPrice,
        originalPrice: basePrice,
        itemSubtotal
      });
    }

    // 2. Voucher validation
    let voucherDiscount = 0;
    let appliedVoucherCode = null;
    if (voucher_code) {
      const vResult = validateVoucher(voucher_code, subtotal);
      if (vResult.valid) {
        voucherDiscount = vResult.discount;
        appliedVoucherCode = vResult.voucher.code;
        // Increment voucher usage
        db.prepare('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?').run(vResult.voucher.id);
      }
    }

    const shippingCost = shippingOption.cost;
    const grandTotal = Math.max(0, subtotal - voucherDiscount + shippingCost);

    // 3. Generate Order Number
    const orderNumber = `SKY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create Order Record
    const orderInsert = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, guest_email, recipient_name, recipient_phone,
        shipping_address, shipping_city, shipping_province, shipping_postal,
        shipping_method, shipping_cost, subtotal, wholesale_discount,
        voucher_code, voucher_discount, grand_total, payment_method,
        payment_status, order_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING_PAYMENT', ?)
    `).run(
      orderNumber,
      user?.id || null,
      user?.email || null,
      recipient_name,
      recipient_phone,
      shipping_address,
      shipping_city,
      shipping_province || 'Indonesia',
      shipping_postal || '',
      shippingOption.name,
      shippingCost,
      subtotal,
      wholesaleDiscountTotal,
      appliedVoucherCode,
      voucherDiscount,
      grandTotal,
      payment_method || 'QRIS',
      notes || null
    );

    const orderId = Number(orderInsert.lastInsertRowid);

    // 5. Insert Order Items & Atomically Reserve Stock
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, variant_title, sku,
        image_url, unit_price, original_price, quantity, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateVariantReserved = db.prepare(`
      UPDATE product_variants
      SET reserved_stock = reserved_stock + ?
      WHERE id = ?
    `);

    const insertInventoryTx = db.prepare(`
      INSERT INTO inventory_transactions (variant_id, type, quantity, reference_id, reference_type, note, user_id)
      VALUES (?, 'reserved', ?, ?, 'order', 'Stock reserved for checkout', ?)
    `);

    for (const vItem of validatedItems) {
      insertOrderItem.run(
        orderId, vItem.product_id, vItem.variant_id, vItem.product_name,
        vItem.variant_title, vItem.variant_sku, vItem.primary_image,
        vItem.unitPrice, vItem.originalPrice, vItem.quantity, vItem.itemSubtotal
      );

      // Reserve stock immediately
      updateVariantReserved.run(vItem.quantity, vItem.variant_id);

      // Record transaction log
      insertInventoryTx.run(vItem.variant_id, vItem.quantity, orderNumber, user?.id || null);
    }

    // 6. Create Payment Record
    const refCode = `PAY-${orderNumber}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const qrData = `00020101021226670014ID.LINKAJA.WWW01189360091800000000000215${refCode}520458125303360540${grandTotal}5802ID5910SKYRA_MAR6007JAKARTA`;

    db.prepare(`
      INSERT INTO payments (order_id, method, amount, status, reference_code, qr_code_data, expires_at)
      VALUES (?, ?, ?, 'PENDING', ?, ?, ?)
    `).run(orderId, payment_method || 'QRIS', grandTotal, refCode, qrData, expiresAt);

    // 7. Remove ordered items from Cart
    db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND is_selected = 1').run(cart.id);

    // 8. Add Notification
    db.prepare(`
      INSERT INTO notifications (user_id, role, title, message, type, link)
      VALUES (?, 'admin', 'Pesanan Baru Masuk!', ?, 'order', ?)
    `).run(user?.id || null, `Pesanan #${orderNumber} senilai Rp ${grandTotal.toLocaleString('id-ID')} dibuat.`, `/admin/orders`);

    return { orderId, orderNumber, grandTotal, refCode, qrData, expiresAt };
  });

  try {
    const result = executeOrderTx();

    // Broadcast Real-time Events
    broadcastRealtimeEvent({ type: 'NEW_ORDER', data: result });
    broadcastRealtimeEvent({ type: 'STOCK_UPDATE', data: { orderNumber: result.orderNumber } });

    res.json({
      success: true,
      message: 'Pesanan berhasil dibuat!',
      ...result
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    res.status(400).json({ error: err.message || 'Terjadi kesalahan saat memproses pesanan' });
  }
});

// List Customer Orders
ordersRouter.get('/orders', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Harap login untuk melihat pesanan' });

  const orders = db.prepare(`
    SELECT o.*, p.status as payment_status_detail, p.reference_code,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as total_items
    FROM orders o
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.user_id = ?
    ORDER BY o.id DESC
  `).all(user.id);

  res.json({ orders });
});

// Single Order Detail
ordersRouter.get('/orders/:orderNumber', (req: Request, res: Response) => {
  const { orderNumber } = req.params;

  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber) as any;
  if (!order) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order.id) as any;
  const paymentProof = db.prepare('SELECT * FROM payment_proofs WHERE order_id = ? ORDER BY id DESC LIMIT 1').get(order.id) as any;

  res.json({
    order: {
      ...order,
      items,
      payment,
      paymentProof
    }
  });
});

// Upload Payment Proof (Manual Bank Transfer)
ordersRouter.post('/orders/:orderNumber/payment-proof', (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const { imageUrl, bankSender, senderName, transferAmount } = req.body;

  if (!imageUrl || !bankSender || !senderName) {
    return res.status(400).json({ error: 'Bukti transfer, nama bank pengirim, dan nama pemilik rekening wajib diisi' });
  }

  const order = db.prepare('SELECT id, order_number, grand_total FROM orders WHERE order_number = ?').get(orderNumber) as any;
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

  const payment = db.prepare('SELECT id FROM payments WHERE order_id = ?').get(order.id) as any;
  if (!payment) return res.status(400).json({ error: 'Data pembayaran tidak ditemukan' });

  db.transaction(() => {
    // Insert Proof
    db.prepare(`
      INSERT INTO payment_proofs (payment_id, order_id, image_url, bank_sender, sender_name, transfer_amount, transfer_date, status)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'PENDING')
    `).run(payment.id, order.id, imageUrl, bankSender, senderName, Number(transferAmount || order.grand_total));

    // Update payment & order status to UNDER_REVIEW / PAYMENT_VERIFICATION
    db.prepare("UPDATE payments SET status = 'UNDER_REVIEW' WHERE id = ?").run(payment.id);
    db.prepare("UPDATE orders SET payment_status = 'UNDER_REVIEW', order_status = 'PAYMENT_VERIFICATION' WHERE id = ?").run(order.id);

    // Notify Admin
    db.prepare(`
      INSERT INTO notifications (role, title, message, type, link)
      VALUES ('admin', 'Bukti Pembayaran Masuk', ?, 'payment', '/admin/payments')
    `).run(`Bukti pembayaran untuk pesanan #${orderNumber} telah diunggah.`);
  })();

  broadcastRealtimeEvent({ type: 'PAYMENT_STATUS_CHANGED', data: { orderNumber, status: 'UNDER_REVIEW' } });

  res.json({ message: 'Bukti pembayaran berhasil diunggah dan sedang dalam verifikasi tim SKYRA!' });
});
