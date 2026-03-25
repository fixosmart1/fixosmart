import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
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

  // SameSite=Lax ensures the cookie is sent after the redirect from Supabase
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
  if (!user || user.suspended) return res.status(403).json({ message: "Forbidden" });
  req.currentUser = user;
  next();
}

// --- MAIN ROUTE HANDLER ---
export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // Manual Cookie Parser Middleware
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

  // User Identity Route
  app.get("/api/me", async (req, res) => {
    const userId = await getSessionUser(req);
    if (!userId) return res.json(null);
    const user = await storage.getUser(userId);
    res.json(user || null);
  });

  // --- FIXED AUTH BRIDGE (Handles 405 and Session missing) ---
  const handleAuthBridge = async (req: any, res: any) => {
    try {
      // Get data from body (POST) or query (GET/Redirect)
      const email = req.body?.email || req.query?.email;
      const fullName = req.body?.fullName || req.query?.fullName;

      if (!email) {
        // If coming back from redirect without params, just go home
        if (req.method === "GET") return res.redirect("/");
        return res.status(400).json({ message: "Email required" });
      }

      const user = await storage.getOrCreateUserByFullName(
        (fullName || email.split("@")[0]).trim(), 
        "customer", 
        email
      );

      if (user.suspended) return res.status(403).json({ message: "Account suspended" });

      const token = await setSession(res, user.id);

      // If it's a browser redirect (GET), send them to the dashboard/home
      if (req.method === "GET") {
        return res.redirect("/");
      }

      res.json({ user, token });
    } catch (err: any) {
      console.error("Auth Bridge Error:", err);
      res.status(500).json({ message: "Authentication failed" });
    }
  };

  // Accept both methods to prevent 405 error
  app.post("/api/supabase-auth", handleAuthBridge);
  app.get("/api/supabase-auth", handleAuthBridge);

  app.post("/api/logout", async (req: any, res) => {
    const token = getSessionToken(req);
    if (token) {
      sessionCache.delete(token);
      await db.delete(schema.sessionStore).where(eq(schema.sessionStore.token, token)).catch(() => {});
    }
    res.clearCookie("session_token", { sameSite: "lax", secure: true, path: "/" });
    res.json({ ok: true });
  });

  // --- BUSINESS ROUTES ---
  app.get("/api/services", async (req, res) => {
    res.json(await storage.getServices());
  });

  app.get("/api/bookings", requireAuth, async (req: any, res) => {
    const data = req.currentUser.role === "admin" 
      ? await storage.getBookings() 
      : await storage.getBookings(req.currentUser.id);
    res.json(data);
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      res.status(201).json(await storage.createBooking(req.body));
    } catch (err) {
      res.status(400).json({ message: "Booking failed" });
    }
  });

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

  return httpServer;
}