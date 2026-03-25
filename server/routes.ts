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
                                                    imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop",
                                                  },
                                                  {
                                                    nameBn: "বৈদ্যুতিক কাজ",
                                                    nameEn: "Electrical Work",
                                                    nameAr: "أعمال كهربائية",
                                                    descriptionEn: "Safe & certified electrical installations and repairs",
                                                    category: "Electric",
                                                    priceSar: "100",
                                                    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop",
                                                  },
                                                  {
                                                    nameBn: "প্লাম্বিং",
                                                    nameEn: "Plumbing",
                                                    nameAr: "سبাكة",
                                                    descriptionEn: "Full plumbing services including leak repair and pipe fitting",
                                                    category: "Plumbing",
                                                    priceSar: "120",
                                                    imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop",
                                                  },
                                                  {
                                                    nameBn: "স্মার্ট হোম সেটআপ",
                                                    nameEn: "Smart Home Setup",
                                                    nameAr: "إعداد المنزل الذكي",
                                                    descriptionEn: "Complete smart home automation and device installation",
                                                    category: "Smart Home",
                                                    priceSar: "200",
                                                    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop",
                                                  },
                                                  {
                                                    nameBn: "সিসিটিভি ইনস্টলেশন",
                                                    nameEn: "CCTV Installation",
                                                    nameAr: "تركيب كاميرات المراقبة",
                                                    descriptionEn: "Professional CCTV security camera setup for homes and businesses",
                                                    category: "Security",
                                                    priceSar: "250",
                                                    imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&h=400&fit=crop",
                                                  },
                                                  {
                                                    nameBn: "যন্ত্রপাতি মেরামত",
                                                    nameEn: "Appliance Repair",
                                                    nameAr: "إصلاح الأجهزة",
                                                    descriptionEn: "Washing machine, refrigerator, dishwasher repairs",
                                                    category: "Appliance",
                                                    priceSar: "130",
                                                    imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=400&fit=crop",
                                                  },
                                                ]);
                                              }

                                              const defaultSettings = [
                                                { key: "hero_image_url", value: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=900&fit=crop", label: "Hero Photo", type: "url" },
                                                { key: "hero_stat_jobs", value: "500+", label: "Hero Stat — Jobs", type: "text" },
                                                { key: "hero_stat_rating", value: "4.9 / 5", label: "Hero Stat — Rating", type: "text" },
                                                { key: "contact_whatsapp", value: "+966501234567", label: "WhatsApp Number", type: "text" },
                                                { key: "footer_note", value: "Serving Jeddah, Saudi Arabia", label: "Footer Note", type: "text" },
                                              ];

                                              const existingKeys = (await db.select({ key: schema.siteSettings.key }).from(schema.siteSettings)).map((s) => s.key);
                                              for (const s of defaultSettings) {
                                                if (!existingKeys.includes(s.key)) {
                                                  await db.insert(schema.siteSettings).values(s);
                                                }
                                              }
                                            }

                                            export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
                                              // Middleware for cookies
                                              app.use((req: any, res: any, next: any) => {
                                                const cookieHeader = req.headers.cookie || "";
                                                req.cookies = Object.fromEntries(
                                                  cookieHeader.split(";").map((c: string) => {
                                                    const [k, ...v] = c.trim().split("=");
                                                    return [k, v.join("=")];
                                                  }).filter(([k]: [string]) => k)
                                                );
                                                next();
                                              });

                                              // Auth Routes
                                              app.get("/api/me", async (req, res) => {
                                                const userId = await getSessionUser(req);
                                                if (!userId) return res.json(null);
                                                const user = await storage.getUser(userId);
                                                res.json(user || null);
                                              });

                                              app.post("/api/login", async (req, res) => {
                                                try {
                                                  const { fullName, email, role } = req.body;
                                                  const user = await storage.getOrCreateUserByFullName(fullName, role || "customer", email);
                                                  if (user.suspended) return res.status(403).json({ message: "Suspended" });
                                                  const token = await setSession(res, user.id);
                                                  res.json({ ...user, _token: token });
                                                } catch (err) {
                                                  res.status(500).json({ message: "Login failed" });
                                                }
                                              });

                                              app.post("/api/logout", async (req: any, res) => {
                                                const token = getSessionToken(req);
                                                if (token) {
                                                  sessionCache.delete(token);
                                                  await db.delete(schema.sessionStore).where(eq(schema.sessionStore.token, token)).catch(() => {});
                                                }
                                                res.clearCookie("session_token", { sameSite: "lax", secure: true, path: "/" });
                                                res.json({ ok: true });
                                              });

                                              // Supabase Auth Bridge
                                              app.post("/api/supabase-auth", async (req: any, res) => {
                                                try {
                                                  const { email, fullName } = req.body;
                                                  if (!email) return res.status(400).json({ message: "Email required" });
                                                  const name = (fullName || email.split("@")[0]).trim() || "User";
                                                  const user = await storage.getOrCreateUserByFullName(name, "customer", email);
                                                  if (user.suspended) return res.status(403).json({ message: "Suspended" });
                                                  const token = await setSession(res, user.id);
                                                  res.json({ user, token });
                                                } catch (err: any) {
                                                  res.status(500).json({ message: "Auth error", detail: err.message });
                                                }
                                              });

                                              // Service Routes
                                              app.get("/api/services", async (req, res) => {
                                                res.json(await storage.getServices());
                                              });

                                              // Booking Routes
                                              app.get("/api/bookings", requireAuth, async (req: any, res) => {
                                                res.json(await storage.getBookings(req.currentUser.role === "customer" ? req.currentUser.id : undefined));
                                              });

                                              app.post("/api/bookings", requireAuth, async (req, res) => {
                                                try {
                                                  const b = await storage.createBooking(req.body);
                                                  res.status(201).json(b);
                                                } catch (err) {
                                                  res.status(400).json({ message: "Booking failed" });
                                                }
                                              });

                                              // Profile
                                              app.patch("/api/profile", requireAuth, async (req: any, res) => {
                                                const updated = await storage.updateUser(req.currentUser.id, req.body);
                                                res.json(updated);
                                              });

                                              // Iqama Tracker
                                              app.get("/api/iqama", requireAuth, async (req: any, res) => {
                                                res.json(await storage.getIqamaTrackers(req.currentUser.id));
                                              });

                                              app.post("/api/iqama", requireAuth, async (req, res) => {
                                                const t = await storage.createIqamaTracker(req.body);
                                                res.status(201).json(t);
                                              });

                                              app.delete("/api/iqama/:id", requireAuth, async (req, res) => {
                                                await storage.deleteIqamaTracker(Number(req.params.id));
                                                res.status(204).send();
                                              });

                                              // Settings
                                              app.get("/api/settings", async (req, res) => {
                                                const all = await storage.getSiteSettings();
                                                const map: Record<string, string> = {};
                                                for (const s of all) map[s.key] = s.value;
                                                res.json(map);
                                              });

                                              // Admin Routes
                                              app.get("/api/admin/users", requireRole("admin"), async (req, res) => {
                                                res.json(await storage.getAllUsers());
                                              });

                                              // Init
                                              seedDatabase().catch(console.error);

                                              return httpServer;
                                            }import type { Express, Request, Response, NextFunction } from "express";
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
        imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop",
      },
      {
        nameBn: "বৈদ্যুতিক কাজ",
        nameEn: "Electrical Work",
        nameAr: "أعمال كهربائية",
        descriptionEn: "Safe & certified electrical installations and repairs",
        category: "Electric",
        priceSar: "100",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop",
      },
      {
        nameBn: "প্লাম্বিং",
        nameEn: "Plumbing",
        nameAr: "سبাكة",
        descriptionEn: "Full plumbing services including leak repair and pipe fitting",
        category: "Plumbing",
        priceSar: "120",
        imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop",
      },
      {
        nameBn: "স্মার্ট হোম সেটআপ",
        nameEn: "Smart Home Setup",
        nameAr: "إعداد المنزل الذكي",
        descriptionEn: "Complete smart home automation and device installation",
        category: "Smart Home",
        priceSar: "200",
        imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop",
      },
      {
        nameBn: "সিসিটিভি ইনস্টলেশন",
        nameEn: "CCTV Installation",
        nameAr: "تركيب كاميرات المراقبة",
        descriptionEn: "Professional CCTV security camera setup for homes and businesses",
        category: "Security",
        priceSar: "250",
        imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&h=400&fit=crop",
      },
      {
        nameBn: "যন্ত্রপাতি মেরামত",
        nameEn: "Appliance Repair",
        nameAr: "إصلاح الأجهزة",
        descriptionEn: "Washing machine, refrigerator, dishwasher repairs",
        category: "Appliance",
        priceSar: "130",
        imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=400&fit=crop",
      },
    ]);
  }

  const defaultSettings = [
    { key: "hero_image_url", value: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=900&fit=crop", label: "Hero Photo", type: "url" },
    { key: "hero_stat_jobs", value: "500+", label: "Hero Stat — Jobs", type: "text" },
    { key: "hero_stat_rating", value: "4.9 / 5", label: "Hero Stat — Rating", type: "text" },
    { key: "contact_whatsapp", value: "+966501234567", label: "WhatsApp Number", type: "text" },
    { key: "footer_note", value: "Serving Jeddah, Saudi Arabia", label: "Footer Note", type: "text" },
  ];

  const existingKeys = (await db.select({ key: schema.siteSettings.key }).from(schema.siteSettings)).map((s) => s.key);
  for (const s of defaultSettings) {
    if (!existingKeys.includes(s.key)) {
      await db.insert(schema.siteSettings).values(s);
    }
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Middleware for cookies
  app.use((req: any, res: any, next: any) => {
    const cookieHeader = req.headers.cookie || "";
    req.cookies = Object.fromEntries(
      cookieHeader.split(";").map((c: string) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      }).filter(([k]: [string]) => k)
    );
    next();
  });

  // Auth Routes
  app.get("/api/me", async (req, res) => {
    const userId = await getSessionUser(req);
    if (!userId) return res.json(null);
    const user = await storage.getUser(userId);
    res.json(user || null);
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { fullName, email, role } = req.body;
      const user = await storage.getOrCreateUserByFullName(fullName, role || "customer", email);
      if (user.suspended) return res.status(403).json({ message: "Suspended" });
      const token = await setSession(res, user.id);
      res.json({ ...user, _token: token });
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/logout", async (req: any, res) => {
    const token = getSessionToken(req);
    if (token) {
      sessionCache.delete(token);
      await db.delete(schema.sessionStore).where(eq(schema.sessionStore.token, token)).catch(() => {});
    }
    res.clearCookie("session_token", { sameSite: "lax", secure: true, path: "/" });
    res.json({ ok: true });
  });

  // Supabase Auth Bridge
  app.post("/api/supabase-auth", async (req: any, res) => {
    try {
      const { email, fullName } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const name = (fullName || email.split("@")[0]).trim() || "User";
      const user = await storage.getOrCreateUserByFullName(name, "customer", email);
      if (user.suspended) return res.status(403).json({ message: "Suspended" });
      const token = await setSession(res, user.id);
      res.json({ user, token });
    } catch (err: any) {
      res.status(500).json({ message: "Auth error", detail: err.message });
    }
  });

  // Service Routes
  app.get("/api/services", async (req, res) => {
    res.json(await storage.getServices());
  });

  // Booking Routes
  app.get("/api/bookings", requireAuth, async (req: any, res) => {
    res.json(await storage.getBookings(req.currentUser.role === "customer" ? req.currentUser.id : undefined));
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const b = await storage.createBooking(req.body);
      res.status(201).json(b);
    } catch (err) {
      res.status(400).json({ message: "Booking failed" });
    }
  });

  // Profile
  app.patch("/api/profile", requireAuth, async (req: any, res) => {
    const updated = await storage.updateUser(req.currentUser.id, req.body);
    res.json(updated);
  });

  // Iqama Tracker
  app.get("/api/iqama", requireAuth, async (req: any, res) => {
    res.json(await storage.getIqamaTrackers(req.currentUser.id));
  });

  app.post("/api/iqama", requireAuth, async (req, res) => {
    const t = await storage.createIqamaTracker(req.body);
    res.status(201).json(t);
  });

  app.delete("/api/iqama/:id", requireAuth, async (req, res) => {
    await storage.deleteIqamaTracker(Number(req.params.id));
    res.status(204).send();
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    const all = await storage.getSiteSettings();
    const map: Record<string, string> = {};
    for (const s of all) map[s.key] = s.value;
    res.json(map);
  });

  // Admin Routes
  app.get("/api/admin/users", requireRole("admin"), async (req, res) => {
    res.json(await storage.getAllUsers());
  });

  // Init
  seedDatabase().catch(console.error);

  return httpServer;
}