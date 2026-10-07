import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { getUserFromToken } from './auth.ts';
import { getProductWholesalePrice } from '../pricing.ts';

export const cartRouter = Router();

function getOrCreateCartId(userId?: number, sessionId?: string): number {
  if (userId) {
    let cart = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(userId) as any;
    if (!cart) {
      const info = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
      return Number(info.lastInsertRowid);
    }
    return cart.id;
  } else {
    const sId = sessionId || 'guest_default_session';
    let cart = db.prepare('SELECT id FROM carts WHERE session_id = ?').get(sId) as any;
    if (!cart) {
      const info = db.prepare('INSERT INTO carts (session_id) VALUES (?)').run(sId);
      return Number(info.lastInsertRowid);
    }
    return cart.id;
  }
}

// Get Cart Details with Live Pricing & Stock
cartRouter.get('/cart', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  const sessionId = req.headers['x-session-id'] as string;
  const cartId = getOrCreateCartId(user?.id, sessionId);

  const rawItems = db.prepare(`
    SELECT ci.id, ci.cart_id, ci.product_id, ci.variant_id, ci.quantity, ci.is_selected,
           p.name as product_name, p.slug as product_slug, p.normal_price, p.promo_price,
           pv.title as variant_title, pv.sku as variant_sku, pv.additional_price,
           pv.available_stock, pv.current_stock,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image_url
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ?
    ORDER BY ci.id DESC
  `).all(cartId);

  let subtotal = 0;
  let totalWholesaleSavings = 0;
  let selectedCount = 0;

  const items = rawItems.map((item: any) => {
    const basePrice = (item.promo_price || item.normal_price) + (item.additional_price || 0);
    const { unitPrice, isWholesale, savingsPerUnit } = getProductWholesalePrice(item.product_id, basePrice, item.quantity);
    
    const itemSubtotal = unitPrice * item.quantity;
    const totalSavings = savingsPerUnit * item.quantity;

    if (item.is_selected) {
      subtotal += itemSubtotal;
      totalWholesaleSavings += totalSavings;
      selectedCount += item.quantity;
    }

    return {
      ...item,
      basePrice,
      unitPrice,
      isWholesale,
      savingsPerUnit,
      itemSubtotal,
      totalSavings,
      isAvailable: item.available_stock >= item.quantity
    };
  });

  res.json({
    cartId,
    items,
    summary: {
      subtotal,
      totalWholesaleSavings,
      selectedCount,
      itemCount: items.length
    }
  });
});

// Add to Cart
cartRouter.post('/cart/items', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  const sessionId = req.headers['x-session-id'] as string;
  const cartId = getOrCreateCartId(user?.id, sessionId);

  const { productId, variantId, quantity = 1 } = req.body;
  if (!productId || !variantId) {
    return res.status(400).json({ error: 'Product ID dan Variant ID wajib disertakan' });
  }

  // Check stock
  const variant = db.prepare('SELECT available_stock FROM product_variants WHERE id = ?').get(variantId) as any;
  if (!variant || variant.available_stock < 1) {
    return res.status(400).json({ error: 'Maaf, stok varian ini sudah habis' });
  }

  // Check if already in cart
  const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?').get(cartId, variantId) as any;

  if (existing) {
    const newQty = Math.min(variant.available_stock, existing.quantity + Number(quantity));
    db.prepare('UPDATE cart_items SET quantity = ?, is_selected = 1 WHERE id = ?').run(newQty, existing.id);
  } else {
    const finalQty = Math.min(variant.available_stock, Math.max(1, Number(quantity)));
    db.prepare(`
      INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, is_selected)
      VALUES (?, ?, ?, ?, 1)
    `).run(cartId, productId, variantId, finalQty);
  }

  res.json({ message: 'Produk berhasil ditambahkan ke keranjang' });
});

// Update Cart Item (Quantity / Selection)
cartRouter.put('/cart/items/:id', (req: Request, res: Response) => {
  const itemId = Number(req.params.id);
  const { quantity, is_selected } = req.body;

  const item = db.prepare(`
    SELECT ci.*, pv.available_stock 
    FROM cart_items ci
    JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.id = ?
  `).get(itemId) as any;

  if (!item) {
    return res.status(404).json({ error: 'Item keranjang tidak ditemukan' });
  }

  if (quantity !== undefined) {
    const validQty = Math.max(1, Math.min(item.available_stock, Number(quantity)));
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(validQty, itemId);
  }

  if (is_selected !== undefined) {
    db.prepare('UPDATE cart_items SET is_selected = ? WHERE id = ?').run(is_selected ? 1 : 0, itemId);
  }

  res.json({ message: 'Keranjang diperbarui' });
});

// Remove from Cart
cartRouter.delete('/cart/items/:id', (req: Request, res: Response) => {
  const itemId = Number(req.params.id);
  db.prepare('DELETE FROM cart_items WHERE id = ?').run(itemId);
  res.json({ message: 'Item berhasil dihapus dari keranjang' });
});

// Select All / Deselect All
cartRouter.put('/cart/select-all', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  const sessionId = req.headers['x-session-id'] as string;
  const cartId = getOrCreateCartId(user?.id, sessionId);
  const { select } = req.body;

  db.prepare('UPDATE cart_items SET is_selected = ? WHERE cart_id = ?').run(select ? 1 : 0, cartId);
  res.json({ message: 'Pilihan item diperbarui' });
});

// Wishlist
cartRouter.get('/wishlist', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Harap login untuk melihat wishlist' });

  const items = db.prepare(`
    SELECT w.id, w.product_id, w.created_at,
           p.name, p.slug, p.normal_price, p.promo_price, p.rating, p.sold_count,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image_url,
           (SELECT SUM(available_stock) FROM product_variants WHERE product_id = p.id) as total_stock
    FROM wishlists w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
    ORDER BY w.id DESC
  `).all(user.id);

  res.json({ wishlist: items });
});

cartRouter.post('/wishlist/:productId', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Harap login untuk menyimpan wishlist' });

  const productId = Number(req.params.productId);
  const existing = db.prepare('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?').get(user.id, productId);

  if (existing) {
    db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(user.id, productId);
    res.json({ inWishlist: false, message: 'Dihapus dari wishlist' });
  } else {
    db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(user.id, productId);
    res.json({ inWishlist: true, message: 'Ditambahkan ke wishlist' });
  }
});
