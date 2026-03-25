import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

// Hybrid session store: in-memory cache (L1) + PostgreSQL (L2 / persistence)
const sessionCache = new Map<string, number>();

function getSessionToken(req: any): string | null {
  return req.headers["x-session-token"] || req.cookies?.session_token || null;
}

const isProduction = process.env.NODE_ENV === "production";

// --- FIXED SESSION FUNCTION (Domain Specific) ---
async function setSession(res: any, userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  sessionCache.set(token, userId);

  try {
    // Persist to DB for Serverless support (Fixes login being lost on restart)
    await db
      .insert(schema.sessionStore)
      .values({ token, userId, expiresAt })
      .onConflictDoUpdate({
        target: schema.sessionStore.token,
        set: { userId, expiresAt },
      });
  } catch (e) {
    console.error("Session DB write error:", e);
  }

  // Optimized Cookie for fixosmart.com
  res.cookie("session_token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax", // Safe for custom domain redirection
    secure: true,    // Production standard
    path: "/",
  });

  return token;
}

async function getSessionUser(req: any): Promise<number | null> {
  const token = getSessionToken(req);
  if (!token) return null;
  const cached = sessionCache.get(token);
  if (cached) return cached;
  try {
    const rows = await db
      .select()
      .from(schema.sessionStore)
      .where(eq(schema.sessionStore.token, token));
    if (rows.length && rows[0].expiresAt > new Date()) {
      sessionCache.set(token, rows[0].userId);
      return rows[0].userId;
    }
  } catch (e) {
    console.error("Session DB read error:", e);
  }
  return null;
}

async function requireAuth(req: any, res: Response, next: NextFunction) {
  const userId = await getSessionUser(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  if (user.suspended)
    return res.status(403).json({ message: "Account suspended" });
  req.currentUser = user;
  next();
}

function requireRole(...roles: string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    const userId = await getSessionUser(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(userId);
    if (!user || !roles.includes(user.role || "customer")) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (user.suspended)
      return res.status(403).json({ message: "Account suspended" });
    req.currentUser = user;
    next();
  };
}

async function seedDatabase() {
  const svc = await storage.getServices();
  if (svc.length === 0) {
    await db.insert(schema.services).values([
      {
        nameBn: "এসি মেরামত",
        nameEn: "AC Repair",
        nameAr: "إصلاح مكيفات الهواء",
        descriptionEn: "Professional AC servicing & repair for all brands",
        category: "AC",
        priceSar: "150",
        imageUrl:
          "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop",
      },
      {
        nameBn: "বৈদ্যুতিক কাজ",
        nameEn: "Electrical Work",
        nameAr: "أعمال كهربائية",
        descriptionEn: "Safe & certified electrical installations and repairs",
        category: "Electric",
        priceSar: "100",
        imageUrl:
          "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop",
      },
      {
        nameBn: "প্লাম্বিং",
        nameEn: "Plumbing",
        nameAr: "سبাكة",
        descriptionEn:
          "Full plumbing services including leak repair and pipe fitting",
        category: "Plumbing",
        priceSar: "120",
        imageUrl:
          "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop",
      },
      {
        nameBn: "স্মার্ট হোম সেটআপ",
        nameEn: "Smart Home Setup",
        nameAr: "إعداد المنزل الذكي",
        descriptionEn: "Complete smart home automation and device installation",
        category: "Smart Home",
        priceSar: "200",
        imageUrl:
          "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop",
      },
      {
        nameBn: "সিসিটিভি ইনস্টলেশন",
        nameEn: "CCTV Installation",
        nameAr: "تركيب كاميرات المراقبة",
        descriptionEn:
          "Professional CCTV security camera setup for homes and businesses",
        category: "Security",
        priceSar: "250",
        imageUrl:
          "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&h=400&fit=crop",
      },
      {
        nameBn: "যন্ত্রপাতি মেরামত",
        nameEn: "Appliance Repair",
        nameAr: "إصلاح الأجهزة",
        descriptionEn: "Washing machine, refrigerator, dishwasher repairs",
        category: "Appliance",
        priceSar: "130",
        imageUrl:
          "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=400&fit=crop",
      },
    ]);
  }
  const prods = await storage.getProducts();
  if (prods.length === 0) {
    await db.insert(schema.products).values([
      {
        nameBn: "স্মার্ট লক",
        nameEn: "Smart Lock",
        nameAr: "قفل ذكي",
        descriptionEn:
          "Fingerprint & app-controlled door lock with remote access",
        priceSar: "450",
        installationFeeSar: "99",
        imageUrl:
          "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&h=500&fit=crop",
      },
      {
        nameBn: "সিসিটিভি ক্যামেরা",
        nameEn: "CCTV Camera",
        nameAr: "كاميرا مراقبة",
        descriptionEn:
          "HD 1080p outdoor security camera with night vision & motion detection",
        priceSar: "300",
        installationFeeSar: "99",
        imageUrl:
          "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&h=500&fit=crop",
      },
      {
        nameBn: "স্মার্ট বাল্ব",
        nameEn: "Smart Bulb",
        nameAr: "لمبة ذكية",
        descriptionEn:
          "Wi-Fi RGB smart bulb, app & voice controlled, 16M colors",
        priceSar: "50",
        installationFeeSar: "0",
        imageUrl:
          "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&h=500&fit=crop",
      },
      {
        nameBn: "স্মার্ট ডোরবেল",
        nameEn: "Smart Doorbell",
        nameAr: "جرس باب ذكي",
        descriptionEn:
          "Video doorbell with HD camera, two-way audio, motion alerts",
        priceSar: "380",
        installationFeeSar: "99",
        imageUrl:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
      },
    ]);
  }
  const promos = await storage.getAllPromoCodes();
  if (promos.length === 0) {
    await db.insert(schema.promoCodes).values([
      {
        code: "WELCOME10",
        discountPercent: 10,
        maxUses: 500,
        expiryDate: "2027-12-31",
      },
      {
        code: "EXPAT20",
        discountPercent: 20,
        maxUses: 200,
        expiryDate: "2027-06-30",
      },
      {
        code: "JEDDAH15",
        discountPercent: 15,
        maxUses: 300,
        expiryDate: "2027-09-30",
      },
    ]);
  }
  const adminUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));
  if (adminUsers.length === 0) {
    await db
      .insert(schema.users)
      .values({
        fullName: "Admin",
        role: "admin",
        email: "admin@fixosmart.com",
      })
      .returning();
    const [tech] = await db
      .insert(schema.users)
      .values({
        fullName: "Mohammed Al-Harbi",
        role: "technician",
        phone: "+966501234567",
        verificationStatus: "approved",
      })
      .returning();
    await db
      .insert(schema.technicians)
      .values({
        userId: tech.id,
        specialization: "AC",
        bio: "10 years experience in AC repair and maintenance",
        rating: "4.9",
        totalJobs: 127,
        hourlyRate: "80",
      });
  }

  const defaultSettings = [
    {
      key: "hero_image_url",
      value:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=900&fit=crop",
      label: "Hero Photo (right side)",
      type: "url",
    },
    {
      key: "hero_stat_jobs",
      value: "500+",
      label: "Hero Stat — Jobs Completed",
      type: "text",
    },
    {
      key: "hero_stat_rating",
      value: "4.9 / 5",
      label: "Hero Stat — Average Rating",
      type: "text",
    },
    {
      key: "hero_stat_customers",
      value: "500+ happy customers",
      label: "Hero — Customers Badge Text",
      type: "text",
    },
    {
      key: "hero_available_text",
      value: "Technicians Available Now",
      label: "Hero — Availability Tag",
      type: "text",
    },
    {
      key: "contact_whatsapp",
      value: "+966501234567",
      label: "WhatsApp / Contact Number",
      type: "text",
    },
    {
      key: "company_tagline",
      value:
        "Professional smart-home services for Jeddah residents — in English, বাংলা, and العربية.",
      label: "Hero Subtitle (English)",
      type: "textarea",
    },
    {
      key: "footer_note",
      value: "Serving Jeddah, Saudi Arabia",
      label: "Footer / Location Note",
      type: "text",
    },
  ];
  const existingKeys = (
    await db.select({ key: schema.siteSettings.key }).from(schema.siteSettings)
  ).map((s) => s.key);
  for (const s of defaultSettings) {
    if (!existingKeys.includes(s.key)) {
      await db.insert(schema.siteSettings).values(s);
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.use((req: any, res: any, next: any) => {
    const cookieHeader = req.headers.cookie || "";
    req.cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((c: string) => {
          const [k, ...v] = c.trim().split("=");
          return [k, v.join("=")];
        })
        .filter(([k]: [string]) => k),
    );
    next();
  });

  app.get("/api/me", async (req, res) => {
    const userId = await getSessionUser(req);
    if (!userId) return res.json(null);
    const user = await storage.getUser(userId);
    res.json(user || null);
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { fullName, email, role, referralCode: appliedCode } = req.body;
      if (!fullName)
        return res.status(400).json({ message: "Full name is required" });
      const safeRole = role === "technician" ? "technician" : "customer";
      const user = await storage.getOrCreateUserByFullName(
        fullName,
        safeRole,
        email,
      );
      if (user.suspended)
        return res
          .status(403)
          .json({ message: "Account suspended. Contact support." });

      if (!user.referralCode) {
        const newCode =
          "FX" + Math.floor(10000 + Math.random() * 90000).toString();
        const updates: any = { referralCode: newCode };
        if (appliedCode) {
          const referrer = await storage.getUserByReferralCode(
            appliedCode.trim().toUpperCase(),
          );
          if (referrer && referrer.id !== user.id) {
            updates.referredBy = appliedCode.trim().toUpperCase();
            updates.discountAvailable = true;
          }
        }
        const updated = await storage.updateUser(user.id, updates);
        const token = await setSession(res, user.id);
        return res.json({ ...updated, _token: token });
      }

      const token = await setSession(res, user.id);
      res.json({ ...user, _token: token });
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/referral/validate/:code", async (req, res) => {
    const referrer = await storage.getUserByReferralCode(
      req.params.code.toUpperCase(),
    );
    if (!referrer)
      return res
        .status(404)
        .json({ valid: false, message: "Invalid referral code" });
    res.json({ valid: true, referrerName: referrer.fullName });
  });

  app.post("/api/referral/consume", requireAuth, async (req: any, res) => {
    const user = req.currentUser;
    if (!user.discountAvailable) return res.json({ ok: true });
    await storage.updateUser(user.id, { discountAvailable: false });
    if (user.referredBy) {
      const inviter = await storage.getUserByReferralCode(user.referredBy);
      if (inviter) await storage.addWalletBalance(inviter.id, 5);
    }
    res.json({ ok: true });
  });

  app.get("/api/referral/stats", requireAuth, async (req: any, res) => {
    const user = req.currentUser;
    const code = user.referralCode || "";
    const friendsJoined = code ? await storage.getReferralCount(code) : 0;
    const rewardsEarned = friendsJoined * 5;
    res.json({
      referralCode: code,
      friendsJoined,
      rewardsEarned,
      walletBalance: parseFloat(user.walletBalance || "0"),
    });
  });

  app.post("/api/wallet/deduct", requireAuth, async (req: any, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid amount" });
    const user = req.currentUser;
    const balance = parseFloat(user.walletBalance || "0");
    const deduct = Math.min(amount, balance);
    if (deduct > 0) await storage.addWalletBalance(user.id, -deduct);
    res.json({ deducted: deduct });
  });

  app.post("/api/logout", async (req: any, res) => {
    const token = getSessionToken(req);
    if (token) {
      sessionCache.delete(token);
      try {
        await db
          .delete(schema.sessionStore)
          .where(eq(schema.sessionStore.token, token));
      } catch (e) {}
    }
    res.clearCookie("session_token", {
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    res.json({ ok: true });
  });

  // ===== FIXED SUPABASE AUTH BRIDGE =====
  app.post("/api/supabase-auth", async (req: any, res) => {
    try {
      const { email, fullName } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const name = (fullName || email.split("@")[0]).trim() || "User";
      const user = await storage.getOrCreateUserByFullName(
        name,
        "customer",
        email,
      );
      if (!user)
        return res
          .status(500)
          .json({ message: "Failed to create or find user" });
      if (user.suspended)
        return res.status(403).json({ message: "Account suspended" });

      const token = await setSession(res, user.id);
      res.json({ user, token });
    } catch (err: any) {
      console.error("Supabase auth bridge error:", err);
      res.status(500).json({
        message: "Database error saving new user",
        detail: err.message,
      });
    }
  });

  app.patch("/api/profile", requireAuth, async (req: any, res) => {
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

  app.get("/api/services", async (req, res) => {
    res.json(await storage.getServices());
  });

  app.post("/api/services", requireRole("admin"), async (req, res) => {
    const s = await storage.createService(req.body);
    res.status(201).json(s);
  });

  app.put("/api/services/:id", requireRole("admin"), async (req, res) => {
    const s = await storage.updateService(Number(req.params.id), req.body);
    res.json(s);
  });

  app.delete("/api/services/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteService(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/services/:id/addons", async (req, res) => {
    res.json(await storage.getServiceAddons(Number(req.params.id)));
  });
  app.post(
    "/api/services/:id/addons",
    requireRole("admin"),
    async (req, res) => {
      const a = await storage.createServiceAddon({
        ...req.body,
        serviceId: Number(req.params.id),
      });
      res.status(201).json(a);
    },
  );
  app.put("/api/addons/:id", requireRole("admin"), async (req, res) => {
    const a = await storage.updateServiceAddon(Number(req.params.id), req.body);
    res.json(a);
  });
  app.delete("/api/addons/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteServiceAddon(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/services/:id/reviews", async (req, res) => {
    res.json(await storage.getReviewsByServiceId(Number(req.params.id)));
  });

  app.get("/api/products", async (req, res) => {
    res.json(await storage.getProducts());
  });

  app.post("/api/products", requireRole("admin"), async (req, res) => {
    const p = await storage.createProduct(req.body);
    res.status(201).json(p);
  });

  app.put("/api/products/:id", requireRole("admin"), async (req, res) => {
    const p = await storage.updateProduct(Number(req.params.id), req.body);
    res.json(p);
  });

  app.delete("/api/products/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/bookings", requireAuth, async (req: any, res) => {
    const user = req.currentUser;
    const myBookings = await storage.getBookings(
      user.role === "customer" ? user.id : undefined,
    );
    res.json(myBookings);
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const b = await storage.createBooking(req.body);
      res.status(201).json(b);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch(
    "/api/bookings/:id/status",
    requireRole("admin", "technician"),
    async (req, res) => {
      const b = await storage.updateBookingStatus(
        Number(req.params.id),
        req.body.status,
      );
      res.json(b);
    },
  );

  app.get("/api/technicians", async (req, res) => {
    res.json(await storage.getTechnicians());
  });

  app.get("/api/technicians/:id", async (req, res) => {
    const tech = await storage.getTechnicianById(Number(req.params.id));
    if (!tech) return res.status(404).json({ message: "Technician not found" });
    res.json(tech);
  });

  app.post("/api/technicians", requireRole("admin"), async (req, res) => {
    const t = await storage.createTechnician(req.body);
    res.status(201).json(t);
  });

  app.get(
    "/api/technician/jobs",
    requireRole("technician", "admin"),
    async (req: any, res) => {
      const tech = await storage.getTechnicianByUserId(req.currentUser.id);
      if (!tech) return res.json([]);
      res.json(await storage.getTechnicianBookingsWithUsers(tech.id));
    },
  );

  app.get(
    "/api/technician/earnings",
    requireRole("technician", "admin"),
    async (req: any, res) => {
      const tech = await storage.getTechnicianByUserId(req.currentUser.id);
      if (!tech) return res.json({ total: 0, monthly: 0, jobs: 0 });
      const jobs = await storage.getTechnicianBookings(tech.id);
      const completed = jobs.filter((j) => j.status === "completed");
      const total = completed.reduce(
        (s, j) => s + Number(j.totalAmountSar || 0),
        0,
      );
      const thisMonth = completed
        .filter((j) => {
          const d = new Date(j.bookingDate);
          const now = new Date();
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        })
        .reduce((s, j) => s + Number(j.totalAmountSar || 0), 0);
      res.json({ total, monthly: thisMonth, jobs: completed.length });
    },
  );

  app.patch(
    "/api/technician/jobs/:id",
    requireRole("technician", "admin"),
    async (req, res) => {
      const b = await storage.updateBookingStatus(
        Number(req.params.id),
        req.body.status,
      );
      res.json(b);
    },
  );

  app.get(
    "/api/verify/status",
    requireRole("technician", "admin"),
    async (req: any, res) => {
      const user = req.currentUser;
      const legacyTech = await storage.getTechnicianByUserId(user.id);
      if (legacyTech) {
        return res.json({
          status: "approved",
          isLegacy: true,
          hasApplication: true,
          technicianId: legacyTech.id,
        });
      }
      const verif = await storage.getVerificationByUserId(user.id);
      if (!verif) return res.json({ status: null, hasApplication: false });
      return res.json({
        status: verif.status,
        hasApplication: true,
        verificationId: verif.id,
        adminNotes: verif.adminNotes,
      });
    },
  );

  app.post(
    "/api/verify/apply",
    requireRole("technician"),
    async (req: any, res) => {
      try {
        const user = req.currentUser;
        const existing = await storage.getVerificationByUserId(user.id);
        if (existing) {
          return res
            .status(409)
            .json({
              message: "You have already submitted a verification application",
            });
        }
        const data = {
          userId: user.id,
          fullName: req.body.fullName || user.fullName,
          phone: req.body.phone || user.phone,
          email: req.body.email || user.email,
          city: req.body.city || user.city,
          specialization: req.body.specialization,
          yearsExperience: Number(req.body.yearsExperience || 0),
          skills: Array.isArray(req.body.skills)
            ? req.body.skills
            : req.body.skills
              ? [req.body.skills]
              : [],
          bio: req.body.bio,
          govIdUrl: req.body.govIdUrl,
          workCertUrl: req.body.workCertUrl,
          portfolioUrls: Array.isArray(req.body.portfolioUrls)
            ? req.body.portfolioUrls
            : [],
          profilePhotoUrl: req.body.profilePhotoUrl,
          videoUrl: req.body.videoUrl,
          status: "pending",
        };
        if (!data.specialization)
          return res
            .status(400)
            .json({ message: "Specialization is required" });
        const verif = await storage.createVerification(data);
        await storage.updateUser(user.id, { verificationStatus: "pending" });
        res.status(201).json(verif);
      } catch (err: any) {
        res
          .status(500)
          .json({ message: err.message || "Failed to submit application" });
      }
    },
  );

  app.get(
    "/api/admin/verifications",
    requireRole("admin"),
    async (req, res) => {
      res.json(await storage.getAllVerifications());
    },
  );

  app.get(
    "/api/admin/verifications/:id",
    requireRole("admin"),
    async (req, res) => {
      const all = await storage.getAllVerifications();
      const v = all.find((v: any) => v.id === Number(req.params.id));
      if (!v) return res.status(404).json({ message: "Not found" });
      res.json(v);
    },
  );

  app.patch(
    "/api/admin/verifications/:id",
    requireRole("admin"),
    async (req: any, res) => {
      try {
        const id = Number(req.params.id);
        const {
          status,
          adminNotes,
          scoreExperience,
          scorePortfolio,
          scoreDocument,
          scoreCommunication,
        } = req.body;
        const updated = await storage.updateVerification(id, {
          ...(status ? { status } : {}),
          ...(adminNotes !== undefined ? { adminNotes } : {}),
          ...(scoreExperience !== undefined
            ? { scoreExperience: Number(scoreExperience) }
            : {}),
          ...(scorePortfolio !== undefined
            ? { scorePortfolio: Number(scorePortfolio) }
            : {}),
          ...(scoreDocument !== undefined
            ? { scoreDocument: Number(scoreDocument) }
            : {}),
          ...(scoreCommunication !== undefined
            ? { scoreCommunication: Number(scoreCommunication) }
            : {}),
        });

        if (status) {
          await storage.updateUser(updated.userId, {
            verificationStatus: status,
          });
        }

        if (status === "approved") {
          const existingTech = await storage.getTechnicianByUserId(
            updated.userId,
          );
          if (!existingTech) {
            await storage.createTechnician({
              userId: updated.userId,
              specialization: updated.specialization,
              bio: updated.bio || "",
              hourlyRate: "80",
              isAvailable: true,
            });
            if (updated.profilePhotoUrl) {
              await storage.updateUser(updated.userId, {
                profilePhoto: updated.profilePhotoUrl,
              });
            }
          }
        }

        res.json(updated);
      } catch (err: any) {
        res
          .status(500)
          .json({ message: err.message || "Failed to update verification" });
      }
    },
  );

  app.get("/api/reviews", async (req, res) => {
    res.json(await storage.getReviews());
  });

  app.post("/api/reviews", requireAuth, async (req: any, res) => {
    try {
      const { bookingId, technicianId, rating, comment, photoUrl } = req.body;
      const userBookings = await storage.getBookings(req.currentUser.id);
      const booking = userBookings.find((b) => b.id === Number(bookingId));
      if (!booking || booking.status !== "completed") {
        return res.status(400).json({ message: "Cannot review this booking" });
      }
      const r = await storage.createReview({
        bookingId: Number(bookingId),
        userId: req.currentUser.id,
        technicianId: technicianId
          ? Number(technicianId)
          : booking.technicianId,
        rating: Number(rating),
        comment: comment || null,
        photoUrl: photoUrl || null,
      });
      const techId = technicianId ? Number(technicianId) : booking.technicianId;
      if (techId) await storage.updateTechnicianRating(techId);
      res.status(201).json(r);
    } catch (err) {
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  app.get("/api/iqama", requireAuth, async (req: