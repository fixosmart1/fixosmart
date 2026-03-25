import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, inArray, desc, sql, and, or } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

// --- GLOBAL CONFIG & SESSION CACHE ---
const sessionCache = new Map<string, number>();

function getSessionToken(req: any): string | null {
  return req.headers["x-session-token"] || req.cookies?.session_token || null;
}

// FIXED: setSession for fixosmart.com (Lax + Secure for Redirects)
async function setSession(res: any, userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  sessionCache.set(token, userId);

  try {
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

  // Cross-domain friendly cookie for your custom domain
  res.cookie("session_token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax", 
    secure: true,    // Required for HTTPS fixosmart.com
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

// --- AUTH MIDDLEWARES ---
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

// --- INITIAL SEED DATA (Your Original Content) ---
async function seedDatabase() {
  const svc = await storage.getServices();
  if (svc.length === 0) {
    await db.insert(schema.services).values([
      { nameBn: "এসি মেরামত", nameEn: "AC Repair", nameAr: "إصلاح مكيفات", descriptionEn: "Professional AC servicing", category: "AC", priceSar: "150", imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600" },
      { nameBn: "বৈদ্যুতিক কাজ", nameEn: "Electrical Work", nameAr: "أعمال كهربائية", descriptionEn: "Certified electrical repair", category: "Electric", priceSar: "100", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600" },
      { nameBn: "প্লাম্বিং", nameEn: "Plumbing", nameAr: "سبাكة", descriptionEn: "Pipe fitting and leaks", category: "Plumbing", priceSar: "120", imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600" },
      { nameBn: "স্মার্ট হোম", nameEn: "Smart Home", nameAr: "المنزل الذكي", descriptionEn: "Automation setup", category: "Smart", priceSar: "200", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600" },
      { nameBn: "সিসিটিভি", nameEn: "CCTV Setup", nameAr: "تركيب كاميرات", descriptionEn: "Security camera installation", category: "Security", priceSar: "250", imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600" }
    ]);
  }
}

// --- ROUTE REGISTRATION ---
export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Manual Cookie Parser
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

  // User Identity
  app.get("/api/me", async (req, res) => {
    const userId = await getSessionUser(req);
    if (!userId) return res.json(null);
    const user = await storage.getUser(userId);
    res.json(user || null);
  });

  // Supabase Auth Integration (Handling GET/POST for fixosmart.com)
  const authHandler = async (req: any, res: any) => {
    try {
      const email = req.body?.email || req.query?.email;
      const fullName = req.body?.fullName || req.query?.fullName;
      if (!email) {
        if (req.method === "GET") return res.redirect("/");
        return res.status(400).json({ message: "Email required" });
      }
      const user = await storage.getOrCreateUserByFullName(fullName || email.split("@")[0], "customer", email);
      if (user.suspended) return res.status(403).json({ message: "Suspended" });
      const token = await setSession(res, user.id);
      if (req.method === "GET") return res.redirect("/");
      res.json({ user, token });
    } catch (err: any) {
      res.status(500).json({ message: "Auth failed", detail: err.message });
    }
  };
  app.post("/api/supabase-auth", authHandler);
  app.get("/api/supabase-auth", authHandler);

  // Profile & Users
  app.get("/api/admin/users", requireRole("admin"), async (req, res) => {
    res.json(await storage.getAllUsers());
  });

  app.patch("/api/profile", requireAuth, async (req: any, res) => {
    res.json(await storage.updateUser(req.currentUser.id, req.body));
  });

  // IQAMA TRACKER SYSTEM
  app.get("/api/iqama", requireAuth, async (req: any, res) => {
    res.json(await storage.getIqamaTrackers(req.currentUser.id));
  });

  app.post("/api/iqama", requireAuth, async (req, res) => {
    res.status(201).json(await storage.createIqamaTracker(req.body));
  });

  app.delete("/api/iqama/:id", requireAuth, async (req: any, res) => {
    await storage.deleteIqamaTracker(Number(req.params.id));
    res.status(204).send();
  });

  // SERVICES & BOOKINGS
  app.get("/api/services", async (req, res) => res.json(await storage.getServices()));

  app.get("/api/bookings", requireAuth, async (req: any, res) => {
    const bookings = req.currentUser.role === "admin" 
      ? await storage.getBookings() 
      : await storage.getBookings(req.currentUser.id);
    res.json(bookings);
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      res.status(201).json(await storage.createBooking(req.body));
    } catch (err) {
      res.status(400).json({ message: "Booking failed" });
    }
  });

  // SITE SETTINGS
  app.get("/api/settings", async (req, res) => {
    const all = await storage.getSiteSettings();
    const map: Record<string, string> = {};
    for (const s of all) map[s.key] = s.value;
    res.json(map);
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

  seedDatabase().catch(console.error);

  return httpServer;
}