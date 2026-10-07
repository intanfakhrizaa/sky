import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'skyra.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency & Foreign Keys for relational integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- 1. Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'staff', 'admin', 'superadmin'
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Addresses
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL DEFAULT 'Home',
      recipient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      street_address TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      image_url TEXT NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    -- 4. Subcategories
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    -- 5. Brands
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      description TEXT
    );

    -- 6. Products
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      brand_id INTEGER,
      category_id INTEGER NOT NULL,
      subcategory_id INTEGER,
      description TEXT NOT NULL,
      short_desc TEXT,
      material TEXT,
      dimensions TEXT,
      weight_grams INTEGER DEFAULT 500,
      normal_price INTEGER NOT NULL,
      promo_price INTEGER,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'draft', 'archived'
      is_featured INTEGER DEFAULT 0,
      is_flash_sale INTEGER DEFAULT 0,
      flash_sale_discount_percent INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      sold_count INTEGER DEFAULT 0,
      video_url TEXT,
      tags TEXT, -- JSON array of strings
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(brand_id) REFERENCES brands(id) ON DELETE SET NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT,
      FOREIGN KEY(subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
    );

    -- 7. Product Variants (Size, Color, Spec)
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      size TEXT,
      color TEXT,
      color_code TEXT,
      additional_price INTEGER DEFAULT 0,
      current_stock INTEGER NOT NULL DEFAULT 0,
      reserved_stock INTEGER NOT NULL DEFAULT 0,
      available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) VIRTUAL,
      low_stock_threshold INTEGER DEFAULT 5,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 8. Product Images
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 9. Wholesale Tier Pricing (Buy More Save More)
    CREATE TABLE IF NOT EXISTS wholesale_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      min_quantity INTEGER NOT NULL,
      max_quantity INTEGER, -- NULL means infinity (e.g. 50+)
      price_per_unit INTEGER NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 10. Inventory Transactions
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'stock_in', 'stock_out', 'reserved', 'sold', 'released', 'adjustment'
      quantity INTEGER NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      note TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
    );

    -- 11. Carts & Cart Items
    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      session_id TEXT UNIQUE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      is_selected INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
    );

    -- 12. Wishlists
    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 13. Orders & Order Items
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER,
      guest_email TEXT,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      shipping_city TEXT NOT NULL,
      shipping_province TEXT NOT NULL,
      shipping_postal TEXT NOT NULL,
      shipping_method TEXT NOT NULL,
      shipping_cost INTEGER NOT NULL DEFAULT 0,
      subtotal INTEGER NOT NULL,
      wholesale_discount INTEGER DEFAULT 0,
      voucher_code TEXT,
      voucher_discount INTEGER DEFAULT 0,
      grand_total INTEGER NOT NULL,
      payment_method TEXT NOT NULL, -- 'QRIS', 'VA_BCA', 'VA_MANDIRI', 'EWALLET_GOPAY', 'EWALLET_OVO', 'BANK_TRANSFER_MANUAL'
      payment_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'UNDER_REVIEW', 'PAID', 'EXPIRED', 'FAILED', 'CANCELLED'
      order_status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT', -- 'PENDING_PAYMENT', 'PAYMENT_VERIFICATION', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'
      tracking_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      variant_title TEXT NOT NULL,
      sku TEXT NOT NULL,
      image_url TEXT,
      unit_price INTEGER NOT NULL,
      original_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 14. Payments
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      method TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      reference_code TEXT NOT NULL UNIQUE,
      qr_code_data TEXT,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 15. Payment Proofs (for Manual Transfer)
    CREATE TABLE IF NOT EXISTS payment_proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      bank_sender TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      transfer_amount INTEGER NOT NULL,
      transfer_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
      admin_notes TEXT,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(payment_id) REFERENCES payments(id) ON DELETE CASCADE,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 16. Reviews
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      variant_title TEXT,
      rating INTEGER NOT NULL,
      title TEXT,
      comment TEXT NOT NULL,
      image_urls TEXT, -- JSON array
      status TEXT DEFAULT 'published', -- 'published', 'pending', 'hidden'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    -- 17. Vouchers
    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      discount_type TEXT NOT NULL, -- 'percent', 'nominal'
      discount_value INTEGER NOT NULL,
      min_spend INTEGER NOT NULL DEFAULT 0,
      max_discount INTEGER,
      quota INTEGER NOT NULL DEFAULT 100,
      used_count INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      start_date DATETIME,
      end_date DATETIME
    );

    -- 18. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, -- NULL means broadcast or admin notification
      role TEXT, -- 'customer', 'admin', 'staff' or NULL
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'order', 'payment', 'stock', 'promo', 'system'
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 19. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT,
      role TEXT,
      action TEXT NOT NULL, -- 'UPDATE_STOCK', 'APPROVE_PAYMENT', 'UPDATE_PRODUCT', etc.
      resource TEXT NOT NULL,
      target_id TEXT,
      old_values TEXT, -- JSON
      new_values TEXT, -- JSON
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);
}
