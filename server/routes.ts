import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

// --- AUTH & SESSION SYSTEM ---
const sessionCache = new Map<string, number>();

function getSessionToken(req: any): string | null {
  return req.headers["x-session-token"] || req.cookies?.session_token || null;
}

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

  res.cookie("session_token", token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: true,
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

// --- DATABASE INITIALIZATION (SEEDING) ---
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
        imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600",
      },
      {
        nameBn: "বৈদ্যুতিক কাজ",
        nameEn: "Electrical Work",
        nameAr: "أعمال كهربائية",
        descriptionEn: "Safe & certified electrical installations and repairs",
        category: "Electric",
        priceSar: "100",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600",
      },
      {
        nameBn: "প্লাম্বিং",
        nameEn: "Plumbing",
        nameAr: "سبাكة",
        descriptionEn: "Full plumbing services including leak repair",
        category: "Plumbing",
        priceSar: "120",
        imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600",
      }
    ]);
  }
}

// --- MAIN ROUTE HANDLER ---
export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Cookie Parser Middleware
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

  app.post("/api/supabase-auth", async (req: any, res) => {
    try {
      const { email, fullName } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const user = await storage.getOrCreateUserByFullName(fullName || email.split("@")[0], "customer", email);
      if (user.suspended) return res.status(403).json({ message: "Suspended" });
      const token = await setSession(res, user.id);
      res.json({ user, token });
    } catch (err: any) {
      res.status(500).json({ message: "Auth error", detail: err.message });
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

  // Business Routes
  app.get("/api/services", async (req, res) => {
    res.json(await storage.getServices());
  });

  app.get("/api/bookings", requireAuth, async (req: any, res) => {
    const bookings = req.currentUser.role === "admin" 
      ? await storage.getBookings() 
      : await storage.getBookings(req.currentUser.id);
    res.json(bookings);
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const b = await storage.createBooking(req.body);
      res.status(201).json(b);
    } catch (err) {
      res.status(400).json({ message: "Booking failed" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req: any, res) => {
    const updated = await storage.updateUser(req.currentUser.id, req.body);
    res.json(updated);
  });

  // Iqama Tracker Routes
  app.get("/api/iqama", requireAuth, async (req: any, res) => {
    res.json(await storage.getIqamaTrackers(req.currentUser.id));
  });

  app.post("/api/iqama", requireAuth, async (req, res) => {
    const t = await storage.createIqamaTracker(req.body);
    res.status(201).json(t);
  });

  app.delete("/api/iqama/:id", requireAuth, async (req: any, res) => {
    await storage.deleteIqamaTracker(Number(req.params.id));
    res.status(204).send();
  });

  // Admin Routes
  app.get("/api/admin/users", requireRole("admin"), async (req, res) => {
    res.json(await storage.getAllUsers());
  });

  app.get("/api/settings", async (req, res) => {
    const all = await storage.getSiteSettings();
    const map: Record<string, string> = {};
    for (const s of all) map[s.key] = s.value;
    res.json(map);
  });

  // Initialization
  seedDatabase().catch(console.error);

  return httpServer;
}