import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

// Cryptographically secure session store
const sessions = new Map<string, number>(); // sessionToken -> userId

function getSessionToken(req: any): string | null {
  return req.headers['x-session-token'] || req.cookies?.session_token || null;
}

function setSession(res: any, userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, userId);
  res.cookie('session_token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  return token;
}

function getSessionUser(req: any): number | null {
  const token = getSessionToken(req);
  if (!token) return null;
  return sessions.get(token) || null;
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

async function requireAuth(req: any, res: Response, next: NextFunction) {
  const userId = getSessionUser(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  if (user.suspended) return res.status(403).json({ message: "Account suspended" });
  req.currentUser = user;
  next();
}

function requireRole(...roles: string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    const userId = getSessionUser(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(userId);
    if (!user || !roles.includes(user.role || 'customer')) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (user.suspended) return res.status(403).json({ message: "Account suspended" });
    req.currentUser = user;
    next();
  };
}

// ─── Seeding ──────────────────────────────────────────────────────────────────

async function seedDatabase() {
  const svc = await storage.getServices();
  if (svc.length === 0) {
    await db.insert(schema.services).values([
      { nameBn: "এসি মেরামত", nameEn: "AC Repair", nameAr: "إصلاح مكيفات الهواء", descriptionEn: "Professional AC servicing & repair for all brands", category: "AC", priceSar: "150", imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop" },
      { nameBn: "বৈদ্যুতিক কাজ", nameEn: "Electrical Work", nameAr: "أعمال كهربائية", descriptionEn: "Safe & certified electrical installations and repairs", category: "Electric", priceSar: "100", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop" },
      { nameBn: "প্লাম্বিং", nameEn: "Plumbing", nameAr: "سباكة", descriptionEn: "Full plumbing services including leak repair and pipe fitting", category: "Plumbing", priceSar: "120", imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop" },
      { nameBn: "স্মার্ট হোম সেটআপ", nameEn: "Smart Home Setup", nameAr: "إعداد المنزل الذكي", descriptionEn: "Complete smart home automation and device installation", category: "Smart Home", priceSar: "200", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop" },
      { nameBn: "সিসিটিভি ইনস্টলেশন", nameEn: "CCTV Installation", nameAr: "تركيب كاميرات المراقبة", descriptionEn: "Professional CCTV security camera setup for homes and businesses", category: "Security", priceSar: "250", imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&h=400&fit=crop" },
      { nameBn: "যন্ত্রপাতি মেরামত", nameEn: "Appliance Repair", nameAr: "إصلاح الأجهزة", descriptionEn: "Washing machine, refrigerator, dishwasher repairs", category: "Appliance", priceSar: "130", imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=400&fit=crop" },
    ]);
  }
  const prods = await storage.getProducts();
  if (prods.length === 0) {
    await db.insert(schema.products).values([
      { nameBn: "স্মার্ট লক", nameEn: "Smart Lock", nameAr: "قفل ذكي", descriptionEn: "Fingerprint & app-controlled door lock with remote access", priceSar: "450", installationFeeSar: "99", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&h=500&fit=crop" },
      { nameBn: "সিসিটিভি ক্যামেরা", nameEn: "CCTV Camera", nameAr: "كاميرا مراقبة", descriptionEn: "HD 1080p outdoor security camera with night vision & motion detection", priceSar: "300", installationFeeSar: "99", imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&h=500&fit=crop" },
      { nameBn: "স্মার্ট বাল্ব", nameEn: "Smart Bulb", nameAr: "لمبة ذكية", descriptionEn: "Wi-Fi RGB smart bulb, app & voice controlled, 16M colors", priceSar: "50", installationFeeSar: "0", imageUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&h=500&fit=crop" },
      { nameBn: "স্মার্ট ডোরবেল", nameEn: "Smart Doorbell", nameAr: "جرس باب ذكي", descriptionEn: "Video doorbell with HD camera, two-way audio, motion alerts", priceSar: "380", installationFeeSar: "99", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop" },
    ]);
  }
  const promos = await storage.getAllPromoCodes();
  if (promos.length === 0) {
    await db.insert(schema.promoCodes).values([
      { code: "WELCOME10", discountPercent: 10, maxUses: 500, expiryDate: "2027-12-31" },
      { code: "EXPAT20", discountPercent: 20, maxUses: 200, expiryDate: "2027-06-30" },
      { code: "JEDDAH15", discountPercent: 15, maxUses: 300, expiryDate: "2027-09-30" },
    ]);
  }
  const adminUsers = await db.select().from(schema.users).where(eq(schema.users.role, 'admin'));
  if (adminUsers.length === 0) {
    await db.insert(schema.users).values({ fullName: "Admin", role: "admin", email: "admin@fixosmart.com" }).returning();
    const [tech] = await db.insert(schema.users).values({ fullName: "Mohammed Al-Harbi", role: "technician", phone: "+966501234567" }).returning();
    await db.insert(schema.technicians).values({ userId: tech.id, specialization: "AC", bio: "10 years experience in AC repair and maintenance", rating: "4.9", totalJobs: 127, hourlyRate: "80" });
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Cookie parser middleware
  app.use((req: any, res: any, next: any) => {
    const cookieHeader = req.headers.cookie || '';
    req.cookies = Object.fromEntries(cookieHeader.split(';').map((c: string) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }).filter(([k]: [string]) => k));
    next();
  });

  // ===== AUTH =====
  app.get('/api/me', async (req, res) => {
    const userId = getSessionUser(req);
    if (!userId) return res.json(null);
    const user = await storage.getUser(userId);
    res.json(user || null);
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { fullName, email, role } = req.body;
      if (!fullName) return res.status(400).json({ message: "Full name is required" });
      const safeRole = role === 'technician' ? 'technician' : 'customer';
      const user = await storage.getOrCreateUserByFullName(fullName, safeRole, email);
      if (user.suspended) return res.status(403).json({ message: "Account suspended. Contact support." });
      setSession(res, user.id);
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/logout', (req: any, res) => {
    const token = getSessionToken(req);
    if (token) sessions.delete(token);
    res.clearCookie('session_token');
    res.json({ ok: true });
  });

  // ===== PROFILE (own profile update) =====
  app.patch('/api/profile', requireAuth, async (req: any, res) => {
    try {
      const { fullName, email, phone, profilePhoto } = req.body;
      const updated = await storage.updateUser(req.currentUser.id, {
        ...(fullName ? { fullName } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(profilePhoto !== undefined ? { profilePhoto } : {}),
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ===== SERVICES (public reads, admin writes) =====
  app.get('/api/services', async (req, res) => {
    res.json(await storage.getServices());
  });

  app.post('/api/services', requireRole('admin'), async (req, res) => {
    const s = await storage.createService(req.body);
    res.status(201).json(s);
  });

  app.put('/api/services/:id', requireRole('admin'), async (req, res) => {
    const s = await storage.updateService(Number(req.params.id), req.body);
    res.json(s);
  });

  app.delete('/api/services/:id', requireRole('admin'), async (req, res) => {
    await storage.deleteService(Number(req.params.id));
    res.status(204).send();
  });

  // ===== PRODUCTS (public reads, admin writes) =====
  app.get('/api/products', async (req, res) => {
    res.json(await storage.getProducts());
  });

  app.post('/api/products', requireRole('admin'), async (req, res) => {
    const p = await storage.createProduct(req.body);
    res.status(201).json(p);
  });

  app.put('/api/products/:id', requireRole('admin'), async (req, res) => {
    const p = await storage.updateProduct(Number(req.params.id), req.body);
    res.json(p);
  });

  app.delete('/api/products/:id', requireRole('admin'), async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  // ===== BOOKINGS =====
  app.get('/api/bookings', requireAuth, async (req: any, res) => {
    const user = req.currentUser;
    const myBookings = await storage.getBookings(user.role === 'customer' ? user.id : undefined);
    res.json(myBookings);
  });

  app.post('/api/bookings', requireAuth, async (req, res) => {
    try {
      const b = await storage.createBooking(req.body);
      res.status(201).json(b);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:id/status', requireRole('admin', 'technician'), async (req, res) => {
    const b = await storage.updateBookingStatus(Number(req.params.id), req.body.status);
    res.json(b);
  });

  // ===== TECHNICIANS (public read, auth writes) =====
  app.get('/api/technicians', async (req, res) => {
    res.json(await storage.getTechnicians());
  });

  app.post('/api/technicians', requireRole('admin'), async (req, res) => {
    const t = await storage.createTechnician(req.body);
    res.status(201).json(t);
  });

  app.get('/api/technician/jobs', requireRole('technician', 'admin'), async (req: any, res) => {
    const tech = await storage.getTechnicianByUserId(req.currentUser.id);
    if (!tech) return res.json([]);
    res.json(await storage.getTechnicianBookingsWithUsers(tech.id));
  });

  app.get('/api/technician/earnings', requireRole('technician', 'admin'), async (req: any, res) => {
    const tech = await storage.getTechnicianByUserId(req.currentUser.id);
    if (!tech) return res.json({ total: 0, monthly: 0, jobs: 0 });
    const jobs = await storage.getTechnicianBookings(tech.id);
    const completed = jobs.filter(j => j.status === 'completed');
    const total = completed.reduce((s, j) => s + Number(j.totalAmountSar || 0), 0);
    const thisMonth = completed.filter(j => {
      const d = new Date(j.bookingDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, j) => s + Number(j.totalAmountSar || 0), 0);
    res.json({ total, monthly: thisMonth, jobs: completed.length });
  });

  app.patch('/api/technician/jobs/:id', requireRole('technician', 'admin'), async (req, res) => {
    const b = await storage.updateBookingStatus(Number(req.params.id), req.body.status);
    res.json(b);
  });

  // ===== REVIEWS =====
  app.get('/api/reviews', async (req, res) => {
    res.json(await storage.getReviews());
  });

  app.post('/api/reviews', requireAuth, async (req, res) => {
    const r = await storage.createReview(req.body);
    res.status(201).json(r);
  });

  // ===== IQAMA =====
  app.get('/api/iqama', requireAuth, async (req: any, res) => {
    res.json(await storage.getIqamaTrackers(req.currentUser.id));
  });

  app.post('/api/iqama', requireAuth, async (req, res) => {
    try {
      const t = await storage.createIqamaTracker(req.body);
      res.status(201).json(t);
    } catch (err) {
      res.status(400).json({ message: "Failed to create iqama record" });
    }
  });

  app.delete('/api/iqama/:id', requireAuth, async (req, res) => {
    await storage.deleteIqamaTracker(Number(req.params.id));
    res.status(204).send();
  });

  // ===== PROMO CODES =====
  app.post('/api/promo/validate', async (req, res) => {
    const promo = await storage.validatePromoCode(req.body.code);
    if (!promo) return res.status(404).json({ message: "Invalid or expired promo code" });
    res.json(promo);
  });

  // ===== SUBSCRIPTIONS =====
  app.get('/api/subscriptions', requireAuth, async (req: any, res) => {
    res.json(await storage.getSubscriptions(req.currentUser.id));
  });

  // ===== ADMIN-ONLY =====
  app.get('/api/admin/analytics', requireRole('admin'), async (req, res) => {
    res.json(await storage.getAnalytics());
  });

  app.get('/api/admin/users', requireRole('admin'), async (req, res) => {
    res.json(await storage.getAllUsers());
  });

  app.patch('/api/admin/users/:id/role', requireRole('admin'), async (req, res) => {
    const u = await storage.updateUserRole(Number(req.params.id), req.body.role);
    res.json(u);
  });

  app.patch('/api/admin/users/:id/suspend', requireRole('admin'), async (req, res) => {
    const { suspended } = req.body;
    const u = await storage.suspendUser(Number(req.params.id), Boolean(suspended));
    res.json(u);
  });

  app.delete('/api/admin/users/:id', requireRole('admin'), async (req, res) => {
    try {
      await storage.deleteUser(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get('/api/admin/bookings', requireRole('admin'), async (req, res) => {
    res.json(await storage.getAllBookingsWithUsers());
  });

  app.patch('/api/admin/bookings/:id/assign', requireRole('admin'), async (req, res) => {
    const { technicianId } = req.body;
    const b = await storage.assignTechnicianToBooking(Number(req.params.id), technicianId ? Number(technicianId) : null);
    res.json(b);
  });

  app.get('/api/admin/technicians', requireRole('admin'), async (req, res) => {
    res.json(await storage.getAllTechniciansWithUsers());
  });

  app.get('/api/admin/promos', requireRole('admin'), async (req, res) => {
    res.json(await storage.getAllPromoCodes());
  });

  app.post('/api/admin/promos', requireRole('admin'), async (req, res) => {
    const p = await storage.createPromoCode({ ...req.body, code: req.body.code.toUpperCase() });
    res.status(201).json(p);
  });

  seedDatabase().catch(console.error);

  return httpServer;
}
