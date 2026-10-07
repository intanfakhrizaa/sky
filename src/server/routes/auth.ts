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
      const user = db.prepare('SELECT id, email, name, phone, role, avatar_url, status FROM users WHERE id = ?').get(Number(userIdMatch[1])) as any;
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
    status: user.status
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

  const updated = db.prepare('SELECT id, email, name, phone, role, avatar_url, status FROM users WHERE id = ?').get(user.id);
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
