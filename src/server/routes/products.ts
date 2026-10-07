import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { searchByImage } from '../ai.ts';
import { getUserFromToken } from './auth.ts';

export const productsRouter = Router();

// List categories with subcategories
productsRouter.get('/categories', (req: Request, res: Response) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
  const subcategories = db.prepare('SELECT * FROM subcategories ORDER BY name ASC').all();

  const formatted = categories.map((cat: any) => ({
    ...cat,
    subcategories: subcategories.filter((sub: any) => sub.category_id === cat.id)
  }));

  res.json({ categories: formatted });
});

// List brands
productsRouter.get('/brands', (req: Request, res: Response) => {
  const brands = db.prepare('SELECT * FROM brands ORDER BY name ASC').all();
  res.json({ brands });
});

// Flash sale items
productsRouter.get('/flash-sale', (req: Request, res: Response) => {
  const items = db.prepare(`
    SELECT p.*, b.name as brand_name, c.name as category_name,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
      (SELECT SUM(available_stock) FROM product_variants WHERE product_id = p.id AND is_active = 1) as total_available_stock
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active' AND p.is_flash_sale = 1
    ORDER BY p.sold_count DESC
    LIMIT 8
  `).all();
  res.json({ items });
});

// Search & Catalog Filter
productsRouter.get('/products', (req: Request, res: Response) => {
  const {
    q,
    category,
    subcategory,
    brand,
    min_price,
    max_price,
    min_rating,
    sort = 'relevance',
    page = '1',
    limit = '16'
  } = req.query as Record<string, string>;

  let sql = `
    SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
      (SELECT SUM(available_stock) FROM product_variants WHERE product_id = p.id AND is_active = 1) as total_available_stock,
      (SELECT COUNT(*) FROM wholesale_rules WHERE product_id = p.id) as has_wholesale
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active'
  `;

  const params: any[] = [];

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.tags LIKE ? OR b.name LIKE ? OR c.name LIKE ?)`;
    params.push(term, term, term, term, term, term);
  }

  if (category) {
    sql += ` AND c.slug = ?`;
    params.push(category);
  }

  if (subcategory) {
    sql += ` AND p.subcategory_id IN (SELECT id FROM subcategories WHERE slug = ?)`;
    params.push(subcategory);
  }

  if (brand) {
    sql += ` AND b.slug = ?`;
    params.push(brand);
  }

  if (min_price && !isNaN(Number(min_price))) {
    sql += ` AND COALESCE(p.promo_price, p.normal_price) >= ?`;
    params.push(Number(min_price));
  }

  if (max_price && !isNaN(Number(max_price))) {
    sql += ` AND COALESCE(p.promo_price, p.normal_price) <= ?`;
    params.push(Number(max_price));
  }

  if (min_rating && !isNaN(Number(min_rating))) {
    sql += ` AND p.rating >= ?`;
    params.push(Number(min_rating));
  }

  // Sorting
  switch (sort) {
    case 'price-low':
      sql += ` ORDER BY COALESCE(p.promo_price, p.normal_price) ASC`;
      break;
    case 'price-high':
      sql += ` ORDER BY COALESCE(p.promo_price, p.normal_price) DESC`;
      break;
    case 'newest':
      sql += ` ORDER BY p.id DESC`;
      break;
    case 'best-selling':
      sql += ` ORDER BY p.sold_count DESC`;
      break;
    case 'rating':
      sql += ` ORDER BY p.rating DESC, p.review_count DESC`;
      break;
    default:
      sql += ` ORDER BY p.is_featured DESC, p.sold_count DESC, p.id DESC`;
      break;
  }

  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const countSql = sql.replace(/SELECT p\.\*[\s\S]*?FROM products p/, 'SELECT COUNT(*) as total FROM products p');
  
  // Total count
  const countRow = db.prepare(countSql).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  sql += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);

  const products = db.prepare(sql).all(...params);

  res.json({
    products: products.map((p: any) => ({
      ...p,
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : []
    })),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Single Product Details
productsRouter.get('/products/:slugOrId', (req: Request, res: Response) => {
  const { slugOrId } = req.params;
  const isId = /^\d+$/.test(slugOrId);

  const product = db.prepare(`
    SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug,
      s.name as subcategory_name, s.slug as subcategory_slug
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories s ON p.subcategory_id = s.id
    WHERE ${isId ? 'p.id = ?' : 'p.slug = ?'}
  `).get(isId ? Number(slugOrId) : slugOrId) as any;

  if (!product) {
    return res.status(404).json({ error: 'Produk tidak ditemukan' });
  }

  // Get Variants
  const variants = db.prepare(`
    SELECT id, sku, title, size, color, color_code, additional_price,
           current_stock, reserved_stock, available_stock, low_stock_threshold, is_active
    FROM product_variants
    WHERE product_id = ? AND is_active = 1
    ORDER BY id ASC
  `).all(product.id);

  // Get Images
  const images = db.prepare(`
    SELECT id, image_url, is_primary, display_order
    FROM product_images
    WHERE product_id = ?
    ORDER BY is_primary DESC, display_order ASC
  `).all(product.id);

  // Get Wholesale Rules
  const wholesaleRules = db.prepare(`
    SELECT min_quantity, max_quantity, price_per_unit
    FROM wholesale_rules
    WHERE product_id = ?
    ORDER BY min_quantity ASC
  `).all(product.id);

  // Get Reviews
  const reviews = db.prepare(`
    SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ? AND r.status = 'published'
    ORDER BY r.id DESC
    LIMIT 10
  `).all(product.id);

  // Get Related & Recommended Products
  const related = db.prepare(`
    SELECT p.id, p.name, p.slug, p.normal_price, p.promo_price, p.rating, p.sold_count,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
    ORDER BY p.sold_count DESC
    LIMIT 6
  `).all(product.category_id, product.id);

  res.json({
    product: {
      ...product,
      tags: typeof product.tags === 'string' ? JSON.parse(product.tags || '[]') : [],
      variants,
      images,
      wholesaleRules,
      reviews,
      related
    }
  });
});

// Visual Search / Search By Image
productsRouter.post('/products/visual-search', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Data gambar wajib disertakan' });
    }

    const result = await searchByImage(imageBase64);
    res.json(result);
  } catch (err: any) {
    console.error('Visual search error:', err);
    res.status(500).json({ error: 'Gagal memproses visual search' });
  }
});

// Submit review
productsRouter.post('/products/:id/reviews', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Harap login untuk memberikan ulasan' });

  const productId = Number(req.params.id);
  const { rating, comment, title, variant_title } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating dan komentar ulasan wajib diisi' });
  }

  db.prepare(`
    INSERT INTO reviews (product_id, user_id, variant_title, rating, title, comment, status)
    VALUES (?, ?, ?, ?, ?, ?, 'published')
  `).run(productId, user.id, variant_title || null, Number(rating), title || '', comment);

  // Update product average rating & review count
  const stats = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
    FROM reviews
    WHERE product_id = ? AND status = 'published'
  `).get(productId) as { avg_rating: number; total_reviews: number };

  db.prepare(`
    UPDATE products
    SET rating = ROUND(?, 1), review_count = ?
    WHERE id = ?
  `).run(stats.avg_rating, stats.total_reviews, productId);

  res.json({ message: 'Ulasan berhasil dikirim!', rating: stats.avg_rating });
});
