import { db } from './db.ts';

export function seedWishlistAndWaitingList() {
  // 1. Seed Wishlist for Customer (user_id: 3)
  const existingWishlist = db.prepare('SELECT COUNT(*) as count FROM wishlists WHERE user_id = 3').get() as { count: number };
  if (existingWishlist.count === 0) {
    const products = db.prepare('SELECT id FROM products LIMIT 5').all() as { id: number }[];
    const insertWish = db.prepare('INSERT OR IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)');
    for (const p of products) {
      insertWish.run(3, p.id);
    }
  }

  // 1b. Seed Loyalty Points & Membership for customer (user_id: 3)
  try {
    const cust = db.prepare('SELECT id, loyalty_points, member_number FROM users WHERE id = 3').get() as any;
    if (cust && (!cust.member_number || cust.loyalty_points === 0)) {
      db.prepare(`
        UPDATE users
        SET loyalty_points = 1850,
            membership_tier = 'silver',
            member_number = 'SKY-VIP-8032',
            member_joined_at = '2026-01-15 10:00:00',
            member_discount_percent = 5
        WHERE id = 3
      `).run();

      const existingLoyalty = db.prepare('SELECT COUNT(*) as count FROM loyalty_history WHERE user_id = 3').get() as { count: number };
      if (existingLoyalty.count === 0) {
        const insertLoyalty = db.prepare(`
          INSERT INTO loyalty_history (user_id, points, balance_after, action_type, description, order_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        insertLoyalty.run(3, 250, 250, 'REGISTRATION_BONUS', 'Bonus Selamat Datang Member Baru SKYRA Marine VIP', null, '2026-01-15 10:05:00');
        insertLoyalty.run(3, 550, 800, 'PURCHASE_REWARD', 'Poin Reward Belanja Pesanan #SKY-WT-901 (Abyss Mask)', 1, '2026-10-07 11:50:00');
        insertLoyalty.run(3, 800, 1600, 'PURCHASE_REWARD', 'Poin Reward Belanja Pesanan #SKY-WT-903 (Marine Lifebuoy)', 3, '2026-10-07 12:20:00');
        insertLoyalty.run(3, 250, 1850, 'TIER_UPGRADE', 'Bonus Kenaikan Tingkat Tier Silver Member', null, '2026-10-07 12:25:00');
      }
    }
  } catch (err) {
    console.error('Error seeding loyalty:', err);
  }

  // 2. Check if waiting list transactions already exist
  const existingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_number = 'SKY-WT-905'").get() as { count: number };
  if (existingOrders.count === 0) {
    // Seed new orders with incoming & outgoing status
    const tx = db.transaction(() => {
      const insertOrder = db.prepare(`
        INSERT INTO orders (
          order_number, user_id, guest_email, recipient_name, recipient_phone,
          shipping_address, shipping_city, shipping_province, shipping_postal,
          shipping_method, shipping_cost, subtotal, wholesale_discount,
          voucher_code, voucher_discount, grand_total, payment_method,
          payment_status, order_status, tracking_number, notes,
          incoming_at, paid_at, processed_at, shipped_at, delivered_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, variant_title, sku,
          image_url, unit_price, original_price, quantity, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertPayment = db.prepare(`
        INSERT INTO payments (
          order_id, method, amount, status, reference_code, qr_code_data, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const prod1 = db.prepare('SELECT * FROM products WHERE sku = ?').get('SKY-DIV-001') as any;
      const var1 = prod1 ? db.prepare('SELECT * FROM product_variants WHERE product_id = ? LIMIT 1').get(prod1.id) as any : null;

      const prod2 = db.prepare('SELECT * FROM products WHERE sku = ?').get('SKY-SRF-001') as any;
      const var2 = prod2 ? db.prepare('SELECT * FROM product_variants WHERE product_id = ? LIMIT 1').get(prod2.id) as any : null;

      const prod3 = db.prepare('SELECT * FROM products WHERE sku = ?').get('SKY-WTR-002') as any;
      const var3 = prod3 ? db.prepare('SELECT * FROM product_variants WHERE product_id = ? LIMIT 1').get(prod3.id) as any : null;

      const expires24h = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();

      // Timestamps for Order 5 (SHIPPED / PESANAN KELUAR)
      const t5_in = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(); // Masuk 4 jam lalu
      const t5_pay = new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(); // Bayar 3.5 jam lalu
      const t5_proc = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // Kemas 3 jam lalu
      const t5_out = new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(); // Keluar Gudang 1.5 jam lalu

      const order5 = insertOrder.run(
        'SKY-WT-905', 3, 'customer@skyra.marine', 'Bima Samudera', '+6281234567803',
        'Jl. Pantai Batu Bolong No. 88, Canggu', 'Badung', 'Bali', '80361',
        'JNE Marine Express (1-2 Hari)', 35000, 1850000, 0,
        'OCEAN10', 185000, 1700000, 'QRIS',
        'PAID', 'SHIPPED', 'SKY-JNE-992144', 'Harap letakkan di teras villa jika tidak ada orang',
        t5_in, t5_pay, t5_proc, t5_out, null, t5_in, t5_out
      );
      const order5Id = Number(order5.lastInsertRowid);
      if (prod1 && var1) {
        insertOrderItem.run(order5Id, prod1.id, var1.id, prod1.name, var1.title, var1.sku, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500', 580000, 650000, 2, 1160000);
      }
      if (prod3 && var3) {
        insertOrderItem.run(order5Id, prod3.id, var3.id, prod3.name, var3.title, var3.sku, 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500', 690000, 750000, 1, 690000);
      }
      insertPayment.run(order5Id, 'QRIS', 1700000, 'PAID', 'PAY-SKY-WT-905', 'QRIS_SETTLED_001', expires24h, t5_in);

      // Timestamps for Order 6 (COMPLETED / PESANAN SELESAI & TIBA)
      const t6_in = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(); // Masuk kemarin
      const t6_pay = new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString();
      const t6_proc = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      const t6_out = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(); // Keluar kemarin sore
      const t6_del = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // Selesai tadi

      const order6 = insertOrder.run(
        'SKY-WT-906', 3, 'customer@skyra.marine', 'Bima Samudera', '+6281234567803',
        'Jl. Pantai Batu Bolong No. 88, Canggu', 'Badung', 'Bali', '80361',
        'Sea Cargo Express (1-2 Hari)', 45000, 6250000, 0,
        'SURFCLUB', 50000, 6245000, 'VA_BCA',
        'PAID', 'COMPLETED', 'SKY-EXP-771920', 'Sudah diterima dengan aman di pos satpam',
        t6_in, t6_pay, t6_proc, t6_out, t6_del, t6_in, t6_del
      );
      const order6Id = Number(order6.lastInsertRowid);
      if (prod2 && var2) {
        insertOrderItem.run(order6Id, prod2.id, var2.id, prod2.name, var2.title, var2.sku, 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=500', 6250000, 6850000, 1, 6250000);
      }
      insertPayment.run(order6Id, 'VA_BCA', 6245000, 'PAID', 'PAY-SKY-WT-906', null, expires24h, t6_in);
    });

    tx();
  }

  // 3. Ensure all orders have incoming_at and status_history entries with exact timestamps
  try {
    const allOrders = db.prepare('SELECT id, order_number, order_status, payment_status, created_at, incoming_at, paid_at, processed_at, shipped_at, delivered_at, tracking_number FROM orders').all() as any[];

    const insertHistory = db.prepare(`
      INSERT INTO order_status_history (order_id, order_number, status, event_type, title, description, timestamp, actor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const ord of allOrders) {
      const incomingTime = ord.incoming_at || ord.created_at;
      // Set incoming_at if null
      if (!ord.incoming_at) {
        db.prepare('UPDATE orders SET incoming_at = ? WHERE id = ?').run(incomingTime, ord.id);
      }

      // Check if history exists
      const histCount = db.prepare('SELECT COUNT(*) as count FROM order_status_history WHERE order_id = ?').get(ord.id) as { count: number };
      if (histCount.count === 0) {
        // 1. Entry: Pesanan Masuk
        insertHistory.run(
          ord.id, ord.order_number, 'PENDING_PAYMENT', 'PESANAN_MASUK',
          'Pesanan Masuk ke Sistem',
          `Pesanan #${ord.order_number} berhasil didaftarkan ke sistem SKYRA Marine.`,
          incomingTime, 'Pelanggan'
        );

        // 2. If under review or paid
        if (ord.payment_status === 'UNDER_REVIEW') {
          const uploadTime = new Date(new Date(incomingTime).getTime() + 12 * 60 * 1000).toISOString();
          insertHistory.run(
            ord.id, ord.order_number, 'PAYMENT_VERIFICATION', 'PEMBAYARAN_DITERIMA',
            'Bukti Pembayaran Masuk Verifikasi',
            'Bukti transfer telah diunggah dan sedang dalam antrian verifikasi tim finance.',
            uploadTime, 'Sistem Verifikasi'
          );
        }

        if (ord.payment_status === 'PAID' || ord.paid_at) {
          const paidTime = ord.paid_at || new Date(new Date(incomingTime).getTime() + 15 * 60 * 1000).toISOString();
          insertHistory.run(
            ord.id, ord.order_number, 'PROCESSING', 'PEMBAYARAN_DITERIMA',
            'Pembayaran Terkonfirmasi Lunas',
            'Pembayaran telah diverifikasi secara penuh. Pesanan diteruskan ke gudang.',
            paidTime, 'Finance Admin'
          );

          const procTime = ord.processed_at || new Date(new Date(paidTime).getTime() + 25 * 60 * 1000).toISOString();
          insertHistory.run(
            ord.id, ord.order_number, 'PROCESSING', 'PROSES_GUDANG',
            'Pesanan Sedang Dikemas di Gudang',
            'Barang dicek kelayakan, di-QC, dan dipacking kardus pelindung tahan air.',
            procTime, 'Tim Gudang'
          );
        }

        if (ord.order_status === 'SHIPPED' || ord.shipped_at) {
          const shipTime = ord.shipped_at || new Date(new Date(incomingTime).getTime() + 90 * 60 * 1000).toISOString();
          insertHistory.run(
            ord.id, ord.order_number, 'SHIPPED', 'PESANAN_KELUAR',
            'Pesanan Keluar dari Gudang (Diserahkan ke Kurir)',
            `Pesanan #${ord.order_number} resmi keluar dari gudang SKYRA Marine dengan nomor resi ${ord.tracking_number || 'SKY-JNE-992144'}.`,
            shipTime, 'Petugas Ekspedisi'
          );
        }

        if (ord.order_status === 'COMPLETED' || ord.delivered_at) {
          const delTime = ord.delivered_at || new Date(new Date(incomingTime).getTime() + 24 * 60 * 60 * 1000).toISOString();
          insertHistory.run(
            ord.id, ord.order_number, 'COMPLETED', 'PESANAN_SELESAI',
            'Pesanan Tiba & Diterima Pelanggan',
            `Pesanan #${ord.order_number} telah sampai di tujuan dan transaksi selesai.`,
            delTime, 'Kurir Pengantar'
          );
        }
      }
    }
  } catch (err) {
    console.error('Error ensuring status history:', err);
  }
}
