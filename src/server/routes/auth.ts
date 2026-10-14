import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const authRouter = Router();

// Middleware to extract simple session or token
export function getUserFromToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (!token) return null;

  // Simple token format: user_{id} or email
  try {
    const userIdMatch = token.match(/^user_(\d+)$/);
    if (userIdMatch) {
      const user = db.prepare('SELECT id, email, name, phone, role, avatar_url, status, loyalty_points, membership_tier, member_number, member_joined_at, member_discount_percent FROM users WHERE id = ?').get(Number(userIdMatch[1])) as any;
      return user && user.status === 'active' ? user : null;
    }
  } catch (err) {
    return null;
  }
  return null;
}

// Register
authRouter.post('/register', (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, nama lengkap, dan password wajib diisi' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
  }

  const passwordHash = `${password}_hash`;
  const info = db.prepare(`
    INSERT INTO users (email, password_hash, name, phone, role, avatar_url, status)
    VALUES (?, ?, ?, ?, 'customer', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', 'active')
  `).run(email.toLowerCase().trim(), passwordHash, name.trim(), phone || null);

  const newUser = db.prepare('SELECT id, email, name, phone, role, avatar_url, status FROM users WHERE id = ?').get(info.lastInsertRowid) as any;
  const token = `user_${newUser.id}`;

  return res.json({
    user: newUser,
    token,
    message: 'Pendaftaran akun berhasil!'
  });
});

// Login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;
  if (!user) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan. Hubungi admin SKYRA.' });
  }

  // Password verification: matches stored hash or simple check
  const expectedHash = `${password}_hash`;
  if (user.password_hash !== expectedHash && user.password_hash !== password) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatar_url: user.avatar_url,
    status: user.status,
    loyalty_points: user.loyalty_points || 0,
    membership_tier: user.membership_tier || 'standard',
    member_number: user.member_number || null,
    member_joined_at: user.member_joined_at || null,
    member_discount_percent: user.member_discount_percent || 0
  };
  const token = `user_${user.id}`;

  return res.json({
    user: safeUser,
    token,
    message: 'Login berhasil!'
  });
});

// Current user profile
authRouter.get('/me', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Belum login' });
  }
  return res.json({ user });
});

// Update profile
authRouter.put('/profile', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Belum login' });
  }

  const { name, phone, avatar_url } = req.body;
  db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        avatar_url = COALESCE(?, avatar_url),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, phone, avatar_url, user.id);

  const updated = db.prepare('SELECT id, email, name, phone, role, avatar_url, status, loyalty_points, membership_tier, member_number, member_joined_at, member_discount_percent FROM users WHERE id = ?').get(user.id);
  return res.json({ user: updated, message: 'Profil berhasil diperbarui' });
});

// Addresses
authRouter.get('/addresses', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Belum login' });

  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(user.id);
  return res.json({ addresses });
});

authRouter.post('/addresses', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Belum login' });

  const { label, recipient_name, phone, street_address, city, province, postal_code, is_default } = req.body;
  if (!recipient_name || !street_address || !city) {
    return res.status(400).json({ error: 'Alamat lengkap wajib diisi' });
  }

  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(user.id);
  }

  const info = db.prepare(`
    INSERT INTO addresses (user_id, label, recipient_name, phone, street_address, city, province, postal_code, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, label || 'Alamat', recipient_name, phone, street_address, city, province || 'Indonesia', postal_code || '', is_default ? 1 : 0);

  const newAddress = db.prepare('SELECT * FROM addresses WHERE id = ?').get(info.lastInsertRowid);
  return res.json({ address: newAddress, message: 'Alamat berhasil ditambahkan' });
});

// Loyalty Points & Membership System
authRouter.get('/loyalty', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Belum login' });

  const history = db.prepare(`
    SELECT * FROM loyalty_history
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(user.id);

  const points = user.loyalty_points || 0;
  let tier = user.membership_tier || 'standard';
  let nextTier = 'silver';
  let pointsNeeded = 1000 - points;
  let perkDiscount = user.member_discount_percent || 0;

  if (points >= 5000) {
    tier = 'platinum';
    nextTier = 'max';
    pointsNeeded = 0;
    perkDiscount = 15;
  } else if (points >= 2500) {
    tier = 'gold';
    nextTier = 'platinum';
    pointsNeeded = 5000 - points;
    perkDiscount = 10;
  } else if (points >= 1000) {
    tier = 'silver';
    nextTier = 'gold';
    pointsNeeded = 2500 - points;
    perkDiscount = 5;
  }

  return res.json({
    points,
    tier,
    memberNumber: user.member_number || null,
    joinedAt: user.member_joined_at || null,
    discountPercent: perkDiscount,
    nextTier,
    pointsNeeded: Math.max(0, pointsNeeded),
    history
  });
});

// Member Registration to get instant discount & welcome points
authRouter.post('/member/register', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Harap login terlebih dahulu' });

  if (user.member_number) {
    return res.status(400).json({ error: 'Anda sudah memiliki kartu member aktif', memberNumber: user.member_number });
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const memberNumber = `SKY-VIP-${user.id}${randomSuffix}`;
  const bonusPoints = 250;
  const currentPoints = (user.loyalty_points || 0) + bonusPoints;
  const discountPercent = 5;
  const tier = currentPoints >= 1000 ? 'silver' : 'standard';

  db.prepare(`
    UPDATE users
    SET member_number = ?,
        loyalty_points = ?,
        membership_tier = ?,
        member_joined_at = CURRENT_TIMESTAMP,
        member_discount_percent = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(memberNumber, currentPoints, tier, discountPercent, user.id);

  db.prepare(`
    INSERT INTO loyalty_history (user_id, points, balance_after, action_type, description)
    VALUES (?, ?, ?, 'REGISTRATION_BONUS', 'Bonus Sambutan Pendaftaran Member Baru SKYRA Marine VIP Club')
  `).run(user.id, bonusPoints, currentPoints);

  const updatedUser = db.prepare('SELECT id, email, name, phone, role, avatar_url, status, loyalty_points, membership_tier, member_number, member_joined_at, member_discount_percent FROM users WHERE id = ?').get(user.id);

  return res.json({
    success: true,
    message: 'Selamat! Kartu Member VIP SKYRA Anda berhasil diaktifkan dengan bonus 250 Poin & Diskon 5%!',
    user: updatedUser,
    memberNumber,
    points: currentPoints
  });
});

// Customer View Transactions with Full Items & Shipment Tracking
authRouter.get('/transactions', (req: Request, res: Response) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Harap login' });

  const orders = db.prepare(`
    SELECT o.*, p.status as payment_status_detail, p.method as pay_method,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
    FROM orders o
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.user_id = ?
    ORDER BY o.id DESC
  `).all(user.id) as any[];

  for (const ord of orders) {
    ord.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
  }

  return res.json({ transactions: orders });
});

// Marine Outlets, Warehouses & Hubs Map ("Where the stuff and maps")
authRouter.get('/stores', (_req: Request, res: Response) => {
  return res.json({
    stores: [
      {
        id: 'skyra-canggu',
        name: 'SKYRA Flagship Store & Surf Test Lab',
        type: 'Flagship Store & Surf Lab',
        city: 'Canggu, Bali',
        province: 'Bali',
        address: 'Jl. Pantai Batu Bolong No. 88, Canggu, Badung, Bali 80361',
        phone: '+62 812-3456-7801',
        hours: 'Setiap Hari 07:00 - 21:00 WITA',
        lat: -8.6595,
        lng: 115.1301,
        services: ['In-Store Pickup', 'Demo Surfboard & Fins', 'Ding Repair Express', 'Surf Wax Station'],
        image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600',
        isPickupAvailable: true
      },
      {
        id: 'skyra-sanur',
        name: 'SKYRA Dive & Marine Harbor Station',
        type: 'Harbor Base & Dive Shop',
        city: 'Sanur, Denpasar',
        province: 'Bali',
        address: 'Pelabuhan Sanur, Jl. Danau Tamblingan No. 42, Sanur, Denpasar 80228',
        phone: '+62 819-9988-8123',
        hours: 'Setiap Hari 06:30 - 19:00 WITA',
        lat: -8.6749,
        lng: 115.2625,
        services: ['In-Store Pickup', 'Regulator & BCD Overhaul', 'Tank Refill Air & Nitrox', 'Fitting Wet Tryout'],
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
        isPickupAvailable: true
      },
      {
        id: 'skyra-ancol',
        name: 'SKYRA Marina & Central Logistics Hub',
        type: 'Central Warehouse & Marina',
        city: 'Jakarta Utara',
        province: 'DKI Jakarta',
        address: 'Kompleks Dermaga Marina Ancol Blok D-14, Pademangan, Jakarta Utara 14430',
        phone: '+62 21-6458-9900',
        hours: 'Senin - Minggu 08:00 - 20:00 WIB',
        lat: -6.1197,
        lng: 106.8315,
        services: ['In-Store Pickup', 'Boat Rigging & Rope Splicing', 'Kayak & SUP Assembly', 'Gudang Pusat Distribusi'],
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600',
        isPickupAvailable: true
      },
      {
        id: 'skyra-bajo',
        name: 'SKYRA Komodo Oceanic Expedition Outpost',
        type: 'Expedition Outpost',
        city: 'Labuan Bajo',
        province: 'Nusa Tenggara Timur',
        address: 'Jl. Soekarno Hatta No. 19 (Waterfront Marina Pier), Labuan Bajo 86554',
        phone: '+62 821-4455-6677',
        hours: 'Setiap Hari 06:00 - 21:00 WITA',
        lat: -8.4964,
        lng: 119.8877,
        services: ['In-Store Pickup', 'Liveaboard Rental Equipment', 'Emergency Marine Beacon Check', 'Reef-Safe Sunscreen Bar'],
        image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
        isPickupAvailable: true
      }
    ]
  });
});
