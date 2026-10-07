import { db } from './db.ts';

export function seedInitialData() {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existingUsers.count > 0) {
    return; // Already seeded
  }

  const tx = db.transaction(() => {
    // 1. Insert Users
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, name, phone, role, avatar_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // In a real app we would use bcrypt; here we store a hash indicator
    insertUser.run('admin@skyra.marine', 'admin123_hash', 'Captain Hendra (Admin)', '+6281234567801', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'active');
    insertUser.run('staff@skyra.marine', 'staff123_hash', 'Sarah Lautan (Staff Ops)', '+6281234567802', 'staff', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'active');
    insertUser.run('customer@skyra.marine', 'customer123_hash', 'Bima Samudera', '+6281234567803', 'customer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'active');

    // 2. Insert Default Address for customer
    const insertAddress = db.prepare(`
      INSERT INTO addresses (user_id, label, recipient_name, phone, street_address, city, province, postal_code, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAddress.run(3, 'Villa Pantai Canggu', 'Bima Samudera', '+6281234567803', 'Jl. Pantai Batu Bolong No. 88, Canggu', 'Badung', 'Bali', '80361', 1);

    // 3. Insert Categories
    const categoriesData = [
      { slug: 'surfing', name: 'Surfing', icon: 'Waves', image_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600', description: 'Surfboards, wetsuits, leashes, fins, wax, dan aksesoris selancar ombak.' },
      { slug: 'swimming', name: 'Swimming', icon: 'Droplets', image_url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600', description: 'Kacamata renang, baju renang performa, pull buoy, fin latihan renang.' },
      { slug: 'diving', name: 'Diving & Snorkeling', icon: 'Compass', image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600', description: 'Masker diving frameless, snorkel kering, regulator, BCD, dan komputer selam.' },
      { slug: 'watersports', name: 'Watersports & Kayak', icon: 'Ship', image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600', description: 'Stand Up Paddle (SUP), Kayak, Life Jacket ISO, Dry Bag, dan paddle board.' },
      { slug: 'beach', name: 'Beach & Coastal Life', icon: 'Sun', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', description: 'Tenda pantai pop-up, payung pantai, tikar pasir bebas, floaties pelampung.' },
      { slug: 'marine', name: 'Marine & Sea Equipment', icon: 'Anchor', image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600', description: 'Tali tambat kapal 316, lifebuoy SOLAS, jangkar lipat, flare strobe darurat.' },
      { slug: 'apparel', name: 'Apparel & Rashguards', icon: 'Shirt', image_url: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600', description: 'Rash guard UPF 50+, boardshorts 4-way stretch, hoodie ocean, celana amfibi.' },
    ];

    const insertCat = db.prepare(`
      INSERT INTO categories (slug, name, icon, image_url, description, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    categoriesData.forEach((c, idx) => {
      insertCat.run(c.slug, c.name, c.icon, c.image_url, c.description, idx + 1);
    });

    // 4. Insert Subcategories
    const subcatsData = [
      // Surfing (cat_id 1)
      { cat_id: 1, slug: 'surfboard', name: 'Surfboard' },
      { cat_id: 1, slug: 'shortboard', name: 'Shortboard' },
      { cat_id: 1, slug: 'longboard', name: 'Longboard' },
      { cat_id: 1, slug: 'fish-board', name: 'Fish Board' },
      { cat_id: 1, slug: 'softboard', name: 'Softboard' },
      { cat_id: 1, slug: 'surf-leash', name: 'Leash' },
      { cat_id: 1, slug: 'surf-fins', name: 'Fins' },
      { cat_id: 1, slug: 'surf-wax', name: 'Surf Wax' },
      { cat_id: 1, slug: 'surf-bag', name: 'Surfboard Bag' },
      { cat_id: 1, slug: 'surf-rashguard', name: 'Rash Guard' },
      { cat_id: 1, slug: 'surf-wetsuit', name: 'Wetsuit' },
      // Swimming (cat_id 2)
      { cat_id: 2, slug: 'swimwear', name: 'Swimwear' },
      { cat_id: 2, slug: 'swimming-goggles', name: 'Swimming Goggles' },
      { cat_id: 2, slug: 'swimming-cap', name: 'Swimming Cap' },
      { cat_id: 2, slug: 'kickboard', name: 'Kickboard' },
      { cat_id: 2, slug: 'pull-buoy', name: 'Pull Buoy' },
      { cat_id: 2, slug: 'swimming-fins', name: 'Swimming Fins' },
      { cat_id: 2, slug: 'hand-paddle', name: 'Hand Paddle' },
      // Diving (cat_id 3)
      { cat_id: 3, slug: 'diving-mask', name: 'Diving Mask' },
      { cat_id: 3, slug: 'snorkel', name: 'Snorkel' },
      { cat_id: 3, slug: 'diving-fins', name: 'Diving Fins' },
      { cat_id: 3, slug: 'dive-wetsuit', name: 'Wetsuit 3-5mm' },
      { cat_id: 3, slug: 'bcd', name: 'BCD Buoyancy' },
      { cat_id: 3, slug: 'regulator', name: 'Regulator' },
      { cat_id: 3, slug: 'dive-computer', name: 'Dive Computer' },
      { cat_id: 3, slug: 'dive-light', name: 'Dive Light' },
      // Watersports (cat_id 4)
      { cat_id: 4, slug: 'life-jacket', name: 'Life Jacket' },
      { cat_id: 4, slug: 'paddle-board', name: 'Stand Up Paddle Board' },
      { cat_id: 4, slug: 'kayak-equipment', name: 'Kayak Equipment' },
      { cat_id: 4, slug: 'dry-bag', name: 'Dry Bag Waterproof' },
      { cat_id: 4, slug: 'water-shoes', name: 'Water Shoes' },
      // Beach (cat_id 5)
      { cat_id: 5, slug: 'beach-tent', name: 'Beach Tent' },
      { cat_id: 5, slug: 'beach-umbrella', name: 'Beach Umbrella' },
      { cat_id: 5, slug: 'beachwear', name: 'Beachwear' },
      { cat_id: 5, slug: 'sandals', name: 'Beach Sandals' },
      // Marine (cat_id 6)
      { cat_id: 6, slug: 'marine-safety', name: 'Marine Safety Equipment' },
      { cat_id: 6, slug: 'marine-rope', name: 'Marine Mooring Rope' },
      { cat_id: 6, slug: 'marine-buoy', name: 'Buoy & Fender' },
      { cat_id: 6, slug: 'marine-tools', name: 'Marine Tools & Hardware' },
      // Apparel (cat_id 7)
      { cat_id: 7, slug: 't-shirt', name: 'Ocean T-Shirt' },
      { cat_id: 7, slug: 'hoodie', name: 'Surf Hoodie' },
      { cat_id: 7, slug: 'boardshorts', name: 'Boardshorts' },
      { cat_id: 7, slug: 'jacket', name: 'Sailing Jacket' }
    ];

    const insertSubcat = db.prepare(`
      INSERT INTO subcategories (category_id, slug, name, description)
      VALUES (?, ?, ?, ?)
    `);
    subcatsData.forEach(sc => {
      insertSubcat.run(sc.cat_id, sc.slug, sc.name, `Koleksi ${sc.name} resmi SKYRA Marine`);
    });

    // 5. Brands
    const brandsData = [
      { name: 'Skyra Marine Pro', slug: 'skyra-pro', logo_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=100', description: 'Perlengkapan laut kelas ekspedisi.' },
      { name: 'RipCurrent Bali', slug: 'ripcurrent', logo_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=100', description: 'Brand selancar performa tinggi Indonesia.' },
      { name: 'ScubaTech Subsea', slug: 'scubatech', logo_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=100', description: 'Teknologi selam presisi tinggi.' },
      { name: 'HydroSpeed Aquatic', slug: 'hydrospeed', logo_url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=100', description: 'Peralatan renang kompetitif Olimpiade.' },
      { name: 'Solara Coastal', slug: 'solara', logo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100', description: 'Perlengkapan santai dan gaya hidup pantai.' },
      { name: 'Nautica Armor', slug: 'nautica-armor', logo_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=100', description: 'Hardware marine dan keselamatan kapal.' }
    ];

    const insertBrand = db.prepare(`
      INSERT INTO brands (name, slug, logo_url, description)
      VALUES (?, ?, ?, ?)
    `);
    brandsData.forEach(b => {
      insertBrand.run(b.name, b.slug, b.logo_url, b.description);
    });

    // 6. Vouchers
    const insertVoucher = db.prepare(`
      INSERT INTO vouchers (code, description, discount_type, discount_value, min_spend, max_discount, quota, used_count, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertVoucher.run('OCEAN10', 'Diskon 10% Semua Perlengkapan Laut', 'percent', 10, 200000, 150000, 500, 12, 1);
    insertVoucher.run('SURFCLUB', 'Potongan Rp 50.000 untuk Papan Selancar & Wetsuit', 'nominal', 50000, 500000, 50000, 200, 4, 1);
    insertVoucher.run('FREESHIP', 'Gratis Ongkir Samudera Ekspedisi', 'nominal', 25000, 150000, 25000, 1000, 35, 1);
    insertVoucher.run('DIVELIFE20', 'Spesial Penyelam Diskon 20%', 'percent', 20, 1000000, 300000, 100, 2, 1);
  });

  tx();
}
