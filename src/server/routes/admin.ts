import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db.ts';
import { getUserFromToken } from './auth.ts';
import { broadcastRealtimeEvent } from '../sse.ts';

export const adminRouter = Router();

// Middleware: Require Admin or Staff Role
export function requireAdminOrStaff(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromToken(req);
  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Akses ditolak: Hanya admin dan staff yang memiliki izin' });
  }
  (req as any).user = user;
  next();
}

adminRouter.use(requireAdminOrStaff);

// Helper to record audit log
function recordAuditLog(req: Request, action: string, resource: string, targetId: string, oldVal: any, newVal: any) {
  const user = (req as any).user;
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_email, role, action, resource, target_id, old_values, new_values, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user?.id || null,
    user?.email || 'admin@skyra.marine',
    user?.role || 'admin',
    action,
    resource,
    String(targetId),
    oldVal ? JSON.stringify(oldVal) : null,
    newVal ? JSON.stringify(newVal) : null,
    req.ip || '127.0.0.1'
  );
}

// 1. Dashboard Overview Stats & Analytics
adminRouter.get('/dashboard', (_req: Request, res: Response) => {
  const totalSales = db.prepare("SELECT COALESCE(SUM(grand_total), 0) as total FROM orders WHERE payment_status = 'PAID'").get() as any;
  const totalOrders = db.prepare("SELECT COUNT(*) as total FROM orders").get() as any;
  const totalCustomers = db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'customer'").get() as any;
  const totalProducts = db.prepare("SELECT COUNT(*) as total FROM products").get() as any;
  
  const pendingPayments = db.prepare("SELECT COUNT(*) as total FROM payments WHERE status = 'PENDING' OR status = 'UNDER_REVIEW'").get() as any;
  const lowStockCount = db.prepare("SELECT COUNT(*) as total FROM product_variants WHERE available_stock <= low_stock_threshold AND is_active = 1").get() as any;

  // Recent 7 Days Sales Trend
  const salesByDay = db.prepare(`
    SELECT DATE(created_at) as order_date, 
           COUNT(*) as order_count, 
           COALESCE(SUM(grand_total), 0) as revenue
    FROM orders
    WHERE payment_status = 'PAID'
    GROUP BY DATE(created_at)
    ORDER BY order_date DESC
    LIMIT 7
  `).all();

  // Top Selling Products
  const bestSellers = db.prepare(`
    SELECT p.id, p.name, p.normal_price, p.promo_price, p.sold_count,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    ORDER BY p.sold_count DESC
    LIMIT 5
  `).all();

  // Recent Orders
  const recentOrders = db.prepare(`
    SELECT id, order_number, recipient_name, grand_total, payment_status, order_status, created_at
    FROM orders
    ORDER BY id DESC
    LIMIT 6
  `).all();

  res.json({
    metrics: {
      totalSales: totalSales.total,
      totalOrders: totalOrders.total,
      totalCustomers: totalCustomers.total,
      totalProducts: totalProducts.total,
      pendingPayments: pendingPayments.total,
      lowStockCount: lowStockCount.total
    },
    salesByDay: salesByDay.reverse(),
    bestSellers,
    recentOrders
  });
});

// 2. All Products Management (Admin)
adminRouter.get('/products', (req: Request, res: Response) => {
  const products = db.prepare(`
    SELECT p.*, b.name as brand_name, c.name as category_name,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
      (SELECT SUM(current_stock) FROM product_variants WHERE product_id = p.id) as total_current_stock,
      (SELECT SUM(available_stock) FROM product_variants WHERE product_id = p.id) as total_available_stock
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.id DESC
  `).all();

  res.json({ products });
});

// Create Product
adminRouter.post('/products', (req: Request, res: Response) => {
  const {
    name, sku, brand_id, category_id, subcategory_id,
    description, short_desc, material, dimensions, weight_grams,
    normal_price, promo_price, status = 'active', images = [],
    variants = [], wholesale = []
  } = req.body;

  if (!name || !sku || !category_id || !normal_price) {
    return res.status(400).json({ error: 'Nama, SKU, Kategori, dan Harga Normal wajib diisi' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

  const createTx = db.transaction(() => {
    const insertProduct = db.prepare(`
      INSERT INTO products (
        sku, name, slug, brand_id, category_id, subcategory_id,
        description, short_desc, material, dimensions, weight_grams,
        normal_price, promo_price, status, rating, review_count, sold_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 0, 0)
    `).run(
      sku, name, slug, brand_id || null, category_id, subcategory_id || null,
      description || '', short_desc || '', material || '', dimensions || '', weight_grams || 500,
      normal_price, promo_price || null, status
    );

    const prodId = Number(insertProduct.lastInsertRowid);

    // Images
    const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)');
    if (images.length === 0) {
      insertImg.run(prodId, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 1, 0);
    } else {
      images.forEach((img: string, idx: number) => {
        insertImg.run(prodId, img, idx === 0 ? 1 : 0, idx);
      });
    }

    // Variants
    const insertVar = db.prepare(`
      INSERT INTO product_variants (product_id, sku, title, size, color, color_code, additional_price, current_stock, reserved_stock, low_stock_threshold)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 5)
    `);

    if (variants.length === 0) {
      insertVar.run(prodId, `${sku}-STD`, 'Standard', null, null, null, 0, 10);
    } else {
      variants.forEach((v: any) => {
        insertVar.run(prodId, v.sku || `${sku}-${Math.random().toString(36).slice(-4)}`, v.title, v.size || null, v.color || null, v.color_code || null, v.additional_price || 0, v.stock || 0);
      });
    }

    // Wholesale rules
    const insertWholesale = db.prepare('INSERT INTO wholesale_rules (product_id, min_quantity, max_quantity, price_per_unit) VALUES (?, ?, ?, ?)');
    wholesale.forEach((w: any) => {
      insertWholesale.run(prodId, w.min_quantity, w.max_quantity || null, w.price_per_unit);
    });

    recordAuditLog(req, 'CREATE_PRODUCT', 'products', String(prodId), null, { name, sku, normal_price });
    return prodId;
  });

  const newId = createTx();
  broadcastRealtimeEvent({ type: 'NEW_PRODUCT', data: { id: newId, name } });

  res.json({ success: true, message: 'Produk berhasil ditambahkan!', productId: newId });
});

// Update Product
adminRouter.put('/products/:id', (req: Request, res: Response) => {
  const prodId = Number(req.params.id);
  const { name, normal_price, promo_price, status, description, short_desc } = req.body;

  const old = db.prepare('SELECT * FROM products WHERE id = ?').get(prodId);
  if (!old) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  db.prepare(`
    UPDATE products
    SET name = COALESCE(?, name),
        normal_price = COALESCE(?, normal_price),
        promo_price = ?,
        status = COALESCE(?, status),
        description = COALESCE(?, description),
        short_desc = COALESCE(?, short_desc),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, normal_price, promo_price || null, status, description, short_desc, prodId);

  recordAuditLog(req, 'UPDATE_PRODUCT', 'products', String(prodId), old, req.body);
  broadcastRealtimeEvent({ type: 'PRICE_UPDATE', data: { id: prodId, normal_price, promo_price } });

  res.json({ message: 'Produk berhasil diperbarui!' });
});

// Delete Product
adminRouter.delete('/products/:id', (req: Request, res: Response) => {
  const prodId = Number(req.params.id);
  const old = db.prepare('SELECT name, sku FROM products WHERE id = ?').get(prodId);
  db.prepare('DELETE FROM products WHERE id = ?').run(prodId);
  recordAuditLog(req, 'DELETE_PRODUCT', 'products', String(prodId), old, null);
  res.json({ message: 'Produk berhasil dihapus' });
});

// 3. Inventory Stock Overview
adminRouter.get('/inventory', (_req: Request, res: Response) => {
  const items = db.prepare(`
    SELECT pv.id as variant_id, pv.sku, pv.title as variant_title, pv.size, pv.color,
           pv.current_stock, pv.reserved_stock, pv.available_stock, pv.low_stock_threshold,
           p.id as product_id, p.name as product_name, p.status as product_status,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    ORDER BY pv.available_stock ASC
  `).all();

  res.json({ items });
});

// Stock In / Out / Adjustment (Atomic Inventory Mutation)
adminRouter.post('/inventory/adjust', (req: Request, res: Response) => {
  const { variantId, type, quantity, note } = req.body;
  if (!variantId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Variant ID dan jumlah stok valid wajib diisi' });
  }

  const variant = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(variantId) as any;
  if (!variant) return res.status(404).json({ error: 'Varian tidak ditemukan' });

  const adjustTx = db.transaction(() => {
    let newCurrentStock = variant.current_stock;
    if (type === 'stock_in') {
      newCurrentStock += Number(quantity);
    } else if (type === 'stock_out') {
      if (variant.available_stock < Number(quantity)) {
        throw new Error('Pengurangan melebihi stok yang tersedia');
      }
      newCurrentStock -= Number(quantity);
    } else if (type === 'adjustment') {
      newCurrentStock = Number(quantity);
    }

    db.prepare('UPDATE product_variants SET current_stock = ? WHERE id = ?').run(newCurrentStock, variantId);

    // Record inventory transaction
    db.prepare(`
      INSERT INTO inventory_transactions (variant_id, type, quantity, note, user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(variantId, type, Number(quantity), note || 'Penyesuaian manual admin', (req as any).user.id);

    recordAuditLog(req, 'ADJUST_STOCK', 'product_variants', String(variantId), { old_stock: variant.current_stock }, { new_stock: newCurrentStock, type });
    return newCurrentStock;
  });

  try {
    const updatedStock = adjustTx();
    broadcastRealtimeEvent({ type: 'STOCK_UPDATE', data: { variantId, current_stock: updatedStock } });
    res.json({ message: 'Stok berhasil diperbarui!', current_stock: updatedStock });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengubah stok' });
  }
});

// 4. Admin Orders List & Status Update
adminRouter.get('/orders', (req: Request, res: Response) => {
  const { status } = req.query;
  let sql = `
    SELECT o.*, p.status as payment_status_detail, p.reference_code,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
    FROM orders o
    LEFT JOIN payments p ON p.order_id = o.id
  `;
  const params: any[] = [];
  if (status) {
    sql += ` WHERE o.order_status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY o.id DESC`;

  const orders = db.prepare(sql).all(...params);
  res.json({ orders });
});

// Update Order Status
adminRouter.put('/orders/:orderNumber/status', (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const { status, trackingNumber } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber) as any;
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

  db.prepare(`
    UPDATE orders
    SET order_status = ?,
        tracking_number = COALESCE(?, tracking_number),
        updated_at = CURRENT_TIMESTAMP
    WHERE order_number = ?
  `).run(status, trackingNumber || null, orderNumber);

  recordAuditLog(req, 'UPDATE_ORDER_STATUS', 'orders', orderNumber, { old_status: order.order_status }, { new_status: status });
  broadcastRealtimeEvent({ type: 'ORDER_STATUS_CHANGED', data: { orderNumber, status, trackingNumber } });

  res.json({ message: `Status pesanan diubah menjadi: ${status}` });
});

// 5. Payment Verification & Approval
adminRouter.get('/payments', (_req: Request, res: Response) => {
  const payments = db.prepare(`
    SELECT p.*, o.order_number, o.recipient_name, o.grand_total, o.payment_method,
           pp.image_url as proof_image, pp.bank_sender, pp.sender_name, pp.status as proof_status,
           pp.admin_notes, pp.id as proof_id
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    LEFT JOIN payment_proofs pp ON pp.payment_id = p.id
    ORDER BY p.id DESC
  `).all();

  res.json({ payments });
});

// Approve or Reject Payment Proof
adminRouter.put('/payments/:id/verify', (req: Request, res: Response) => {
  const paymentId = Number(req.params.id);
  const { action, adminNotes } = req.body; // 'APPROVE' or 'REJECT'

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as any;
  if (!payment) return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(payment.order_id) as any;
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

  const verifyTx = db.transaction(() => {
    if (action === 'APPROVE') {
      // 1. Mark Payment as PAID
      db.prepare("UPDATE payments SET status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(paymentId);
      db.prepare("UPDATE orders SET payment_status = 'PAID', order_status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);
      db.prepare("UPDATE payment_proofs SET status = 'APPROVED', admin_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE payment_id = ?").run(adminNotes || 'Diverifikasi oleh admin', (req as any).user.id, paymentId);

      // 2. Finalize stock deduction: transfer from reserved to sold!
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as any[];
      for (const item of items) {
        db.prepare(`
          UPDATE product_variants
          SET current_stock = current_stock - ?,
              reserved_stock = reserved_stock - ?
          WHERE id = ?
        `).run(item.quantity, item.quantity, item.variant_id);

        // Record inventory transaction
        db.prepare(`
          INSERT INTO inventory_transactions (variant_id, type, quantity, reference_id, reference_type, note, user_id)
          VALUES (?, 'sold', ?, ?, 'order_paid', 'Barang resmi terjual & dibayar', ?)
        `).run(item.variant_id, item.quantity, order.order_number, (req as any).user.id);

        // Increment product sold count
        db.prepare('UPDATE products SET sold_count = sold_count + ? WHERE id = ?').run(item.quantity, item.product_id);
      }

      // Notify customer
      if (order.user_id) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, link)
          VALUES (?, 'Pembayaran Diterima!', ?, 'payment', ?)
        `).run(order.user_id, `Pembayaran pesanan #${order.order_number} telah disetujui. Pesanan sedang diproses.`, `/orders/${order.order_number}`);
      }
    } else {
      // REJECT
      db.prepare("UPDATE payments SET status = 'FAILED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(paymentId);
      db.prepare("UPDATE orders SET payment_status = 'FAILED', order_status = 'PENDING_PAYMENT', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);
      db.prepare("UPDATE payment_proofs SET status = 'REJECTED', admin_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE payment_id = ?").run(adminNotes || 'Bukti transfer tidak valid/dana belum masuk', (req as any).user.id, paymentId);

      // Notify customer
      if (order.user_id) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, link)
          VALUES (?, 'Bukti Pembayaran Ditolak', ?, 'payment', ?)
        `).run(order.user_id, `Bukti pembayaran #${order.order_number} ditolak: ${adminNotes || 'Silakan unggah ulang bukti yang jelas'}.`, `/orders/${order.order_number}`);
      }
    }

    recordAuditLog(req, `${action}_PAYMENT`, 'payments', String(paymentId), { old_status: payment.status }, { action, adminNotes });
  });

  verifyTx();
  broadcastRealtimeEvent({ type: 'PAYMENT_STATUS_CHANGED', data: { orderNumber: order.order_number, action } });
  broadcastRealtimeEvent({ type: 'STOCK_UPDATE', data: { orderNumber: order.order_number } });

  res.json({ message: action === 'APPROVE' ? 'Pembayaran berhasil disetujui!' : 'Pembayaran ditolak' });
});

// 6. Customers Management
adminRouter.get('/customers', (_req: Request, res: Response) => {
  const customers = db.prepare(`
    SELECT u.id, u.email, u.name, u.phone, u.status, u.created_at,
      (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as total_orders,
      (SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE user_id = u.id AND payment_status = 'PAID') as total_spend
    FROM users u
    WHERE u.role = 'customer'
    ORDER BY u.id DESC
  `).all();

  res.json({ customers });
});

adminRouter.put('/customers/:id/status', (req: Request, res: Response) => {
  const custId = Number(req.params.id);
  const { status } = req.body; // 'active' or 'suspended'

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, custId);
  recordAuditLog(req, 'UPDATE_CUSTOMER_STATUS', 'users', String(custId), null, { status });
  res.json({ message: `Status akun diubah menjadi ${status}` });
});

// 7. Sales Reports & Analytics
adminRouter.get('/reports/sales', (req: Request, res: Response) => {
  const { format } = req.query;

  const salesData = db.prepare(`
    SELECT o.id, o.order_number, o.created_at, o.recipient_name, o.grand_total,
           o.subtotal, o.shipping_cost, o.wholesale_discount, o.voucher_discount,
           o.payment_method, o.order_status
    FROM orders o
    WHERE o.payment_status = 'PAID'
    ORDER BY o.id DESC
  `).all() as any[];

  const categoryBreakdown = db.prepare(`
    SELECT c.name as category_name, 
           COUNT(oi.id) as items_sold, 
           SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'PAID'
    GROUP BY c.id
    ORDER BY total_revenue DESC
  `).all();

  if (format === 'csv') {
    let csv = 'Order ID,Nomor Pesanan,Tanggal,Penerima,Subtotal,Diskon Grosir,Voucher,Ongkir,Grand Total,Metode Bayar\n';
    salesData.forEach((row: any) => {
      csv += `${row.id},"${row.order_number}","${row.created_at}","${row.recipient_name}",${row.subtotal},${row.wholesale_discount},${row.voucher_discount},${row.shipping_cost},${row.grand_total},"${row.payment_method}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="skyra-sales-report.csv"');
    return res.send(csv);
  }

  res.json({
    sales: salesData,
    categoryBreakdown,
    summary: {
      totalRevenue: salesData.reduce((acc, cur) => acc + cur.grand_total, 0),
      totalOrders: salesData.length
    }
  });
});

// 8. Audit Logs
adminRouter.get('/audit-logs', (_req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50').all();
  res.json({ logs });
});
