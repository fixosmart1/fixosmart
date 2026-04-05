import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { pool } from "./db";
import { createServer } from "http";
import path from "path";
import fs from "fs";

// Run a single SQL statement safely — logs success/skip/error but only throws on real failures
async function safeQuery(label: string, sql: string, allowedErrors: string[] = []): Promise<boolean> {
  try {
    await pool.query(sql);
    console.log(`[ensureSchema] ✓ ${label}`);
    return true;
  } catch (e: any) {
    const msg: string = e.message || String(e);
    const code: string = e.code || '';
    // 42P07 = relation already exists, 42710 = constraint already exists — safe to ignore
    if (code === '42P07' || code === '42710' || msg.includes('already exists')) {
      console.log(`[ensureSchema] ○ ${label} (already exists)`);
      return false;
    }
    if (allowedErrors.some((s) => msg.includes(s))) {
      console.warn(`[ensureSchema] ⚠ ${label} skipped:`, msg);
      return false;
    }
    console.error(`[ensureSchema] ✗ ${label} FAILED:`, msg);
    throw e;
  }
}

// Auto-create all tables on cold start so production DB is always ready
async function ensureSchema() {
  // ── Pre-flight: detect Supabase UUID conflict on public.users ─────────────
  // Some Supabase starter templates create public.users with UUID PK.
  // If that table already exists with a non-integer id, rename it so our
  // SERIAL-based users table can be created cleanly.
  try {
    const { rows } = await pool.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
    `);
    if (rows.length > 0 && rows[0].data_type !== 'integer') {
      console.warn(`[ensureSchema] public.users exists with id type '${rows[0].data_type}' — renaming to users_supabase_bk`);
      await pool.query(`ALTER TABLE public.users RENAME TO users_supabase_bk`);
    }
  } catch (_) { /* table doesn't exist yet — that's fine */ }

  // ── Step 1: Core tables — NO REFERENCES constraints (avoids UUID/int FK mismatch)
  // FK integrity is enforced at the application layer (Drizzle + storage).
  await safeQuery('table: users', `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT DEFAULT 'customer',
      language TEXT DEFAULT 'en',
      iqama_expiry DATE,
      city TEXT DEFAULT 'Jeddah',
      referral_code TEXT,
      referred_by TEXT,
      profile_photo TEXT,
      suspended BOOLEAN DEFAULT false,
      verification_status TEXT,
      discount_available BOOLEAN DEFAULT false,
      wallet_balance NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await safeQuery('table: technicians', `
    CREATE TABLE IF NOT EXISTS technicians (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      specialization TEXT NOT NULL,
      bio TEXT,
      rating NUMERIC DEFAULT 0,
      total_jobs INTEGER DEFAULT 0,
      is_available BOOLEAN DEFAULT true,
      hourly_rate NUMERIC DEFAULT 0,
      completion_photo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await safeQuery('table: technician_verifications', `
    CREATE TABLE IF NOT EXISTS technician_verifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT, email TEXT, city TEXT,
      specialization TEXT NOT NULL,
      years_experience INTEGER DEFAULT 0,
      skills TEXT[], bio TEXT,
      gov_id_url TEXT, work_cert_url TEXT,
      portfolio_urls TEXT[], profile_photo_url TEXT, video_url TEXT,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      score_experience INTEGER, score_portfolio INTEGER,
      score_document INTEGER, score_communication INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await safeQuery('table: services', `
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name_bn TEXT NOT NULL, name_en TEXT NOT NULL, name_ar TEXT NOT NULL,
      description_en TEXT, category TEXT NOT NULL,
      price_sar NUMERIC NOT NULL, image_url TEXT,
      is_active BOOLEAN DEFAULT true
    )
  `);

  await safeQuery('table: products', `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name_bn TEXT NOT NULL, name_en TEXT NOT NULL, name_ar TEXT NOT NULL,
      description_en TEXT,
      price_sar NUMERIC NOT NULL,
      installation_fee_sar NUMERIC DEFAULT 99,
      affiliate_link TEXT, image_url TEXT,
      is_active BOOLEAN DEFAULT true
    )
  `);

  await safeQuery('table: bookings', `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      technician_id INTEGER,
      service_id INTEGER,
      product_id INTEGER,
      booking_date DATE NOT NULL, booking_time TEXT NOT NULL,
      district TEXT NOT NULL, city TEXT DEFAULT 'Jeddah',
      address TEXT NOT NULL, notes TEXT,
      status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'normal',
      location_lat NUMERIC, location_lng NUMERIC,
      total_amount_sar NUMERIC, promo_code TEXT,
      discount_sar NUMERIC DEFAULT 0,
      language_preference TEXT DEFAULT 'en',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await safeQuery('table: service_addons', `
    CREATE TABLE IF NOT EXISTS service_addons (
      id SERIAL PRIMARY KEY,
      service_id INTEGER NOT NULL,
      name_en TEXT NOT NULL, name_bn TEXT NOT NULL, name_ar TEXT NOT NULL,
      price_sar NUMERIC NOT NULL, is_active BOOLEAN DEFAULT true
    )
  `);

  await safeQuery('table: reviews', `
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER,
      user_id INTEGER,
      technician_id INTEGER,
      rating INTEGER NOT NULL, comment TEXT, photo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await safeQuery('table: iqama_trackers', `
    CREATE TABLE IF NOT EXISTS iqama_trackers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      iqama_number TEXT NOT NULL, expiry_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await safeQuery('table: subscriptions', `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      plan_name TEXT NOT NULL, price_sar NUMERIC NOT NULL,
      start_date DATE NOT NULL, end_date DATE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await safeQuery('table: promo_codes', `
    CREATE TABLE IF NOT EXISTS promo_codes (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_percent INTEGER NOT NULL,
      max_uses INTEGER DEFAULT 100, used_count INTEGER DEFAULT 0,
      expiry_date DATE, is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await safeQuery('table: site_settings', `
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL, label TEXT,
      type TEXT DEFAULT 'text',
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await safeQuery('table: session_store', `
    CREATE TABLE IF NOT EXISTS session_store (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TIMESTAMP NOT NULL
    )
  `);

  // ── Step 2: Add missing columns to existing tables ─────────────────────────
  const alters = [
    `ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    `ALTER TABLE services ADD COLUMN IF NOT EXISTS description_en TEXT`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en TEXT`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_link TEXT`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS installation_fee_sar NUMERIC DEFAULT 99`,
  ];
  for (const sql of alters) {
    await safeQuery(`alter: ${sql.slice(0, 60)}`, sql, ['does not exist']);
  }

  // ── Step 3: Unique constraint on users.email ───────────────────────────────
  await safeQuery('constraint: users_email_key', `
    DO $body$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='email')
        AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_email_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
      END IF;
    END $body$
  `);

  // ── Step 4: Seed default data ──────────────────────────────────────────────
  await safeQuery('seed: site_settings', `
    INSERT INTO site_settings (key, value, label, type) VALUES
      ('hero_image_url','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=900&fit=crop','Hero Image URL','text'),
      ('hero_stat_rating','4.9 / 5','Rating Stat','text'),
      ('hero_stat_customers','500+ happy customers','Customers Stat','text'),
      ('hero_stat_jobs','500+','Jobs Stat','text'),
      ('hero_available_text','Technicians Available Now','Available Text','text'),
      ('footer_note','Serving Jeddah, Saudi Arabia','Footer Note','text'),
      ('company_tagline','Professional smart-home services for Jeddah residents','Company Tagline','text'),
      ('contact_whatsapp','+966542418449','WhatsApp Contact','text')
    ON CONFLICT (key) DO NOTHING
  `);

  await safeQuery('seed: admin user', `
    INSERT INTO users (full_name, email, role)
    SELECT 'Admin', 'admin@fixosmart.com', 'admin'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@fixosmart.com')
  `);

  // ── Step 5: Enable RLS on all app tables ──────────────────────────────────
  const rlsTables = ['users','technicians','technician_verifications','services','products',
    'bookings','service_addons','reviews','iqama_trackers','subscriptions',
    'promo_codes','site_settings','session_store'];
  for (const t of rlsTables) {
    await safeQuery(`RLS: ${t}`, `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`, ['does not exist']);
  }

  // ── Step 5b: RLS on Supabase profiles table if it exists ──────────────────
  await safeQuery('RLS: profiles (if exists)', `
    DO $body$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
        EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
      END IF;
    END $body$
  `);

  // ── Step 6: Fix handle_new_user trigger security (mutable search_path) ────
  await safeQuery('fix: handle_new_user', `
    DO $body$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
      ) THEN
        EXECUTE $func$
          CREATE OR REPLACE FUNCTION public.handle_new_user()
          RETURNS trigger LANGUAGE plpgsql
          SECURITY DEFINER SET search_path = public
          AS $inner$
          BEGIN
            INSERT INTO public.profiles (id, full_name, email, avatar_url, role, language)
            VALUES (
              new.id,
              COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
              COALESCE(new.email, ''),
              COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
              'customer', 'en'
            )
            ON CONFLICT (id) DO NOTHING;
            RETURN new;
          END; $inner$
        $func$;
      END IF;
    END $body$
  `);

  console.log('[ensureSchema] ✅ All steps completed successfully');
}

const ALLOWED_ORIGINS = [
  "https://www.fixosmart.com",
  "https://fixosmart.com",
  "https://fixosmart.vercel.app",
];

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// CORS — allow credentials from production origins
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-session-token");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

async function initialize() {
  await ensureSchema();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // Static files not needed in Vercel (CDN serves them), but kept for safety
  const distPath = path.resolve(process.cwd(), "dist/public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("/{*path}", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
}

// Start initialization immediately; capture any error so handler can respond fast
initPromise = initialize().catch((err) => {
  initError = err;
  console.error("[vercel-handler] initialization failed:", err);
});

const handler = async (req: Request, res: Response) => {
  try {
    await initPromise;
  } catch (_) {}

  // If init failed, return a clear error rather than hanging
  if (initError) {
    return res.status(503).json({
      message: "Service temporarily unavailable. Please check server logs.",
      error: initError.message,
    });
  }

  (app as any)(req, res);
};

export default handler;
