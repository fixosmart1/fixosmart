-- FixoSmart Production Schema for Supabase
-- Run this in Supabase Dashboard → SQL Editor → New Query

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
);

CREATE TABLE IF NOT EXISTS technicians (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  specialization TEXT NOT NULL,
  bio TEXT,
  rating NUMERIC DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  hourly_rate NUMERIC DEFAULT 0,
  completion_photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technician_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  specialization TEXT NOT NULL,
  years_experience INTEGER DEFAULT 0,
  skills TEXT[],
  bio TEXT,
  gov_id_url TEXT,
  work_cert_url TEXT,
  portfolio_urls TEXT[],
  profile_photo_url TEXT,
  video_url TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  score_experience INTEGER,
  score_portfolio INTEGER,
  score_document INTEGER,
  score_communication INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  category TEXT NOT NULL,
  price_sar NUMERIC NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  price_sar NUMERIC NOT NULL,
  installation_fee_sar NUMERIC DEFAULT 99,
  affiliate_link TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  technician_id INTEGER REFERENCES technicians(id),
  service_id INTEGER REFERENCES services(id),
  product_id INTEGER REFERENCES products(id),
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT DEFAULT 'Jeddah',
  address TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  location_lat NUMERIC,
  location_lng NUMERIC,
  total_amount_sar NUMERIC,
  promo_code TEXT,
  discount_sar NUMERIC DEFAULT 0,
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_addons (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id),
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  price_sar NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  user_id INTEGER REFERENCES users(id),
  technician_id INTEGER REFERENCES technicians(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iqama_trackers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  iqama_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plan_name TEXT NOT NULL,
  price_sar NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT,
  type TEXT DEFAULT 'text',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_store (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Seed default site settings (only if not already present)
INSERT INTO site_settings (key, value, label, type) VALUES
  ('hero_image_url', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=900&fit=crop', 'Hero Image URL', 'text'),
  ('hero_stat_rating', '4.9 / 5', 'Rating Stat', 'text'),
  ('hero_stat_customers', '500+ happy customers', 'Customers Stat', 'text'),
  ('hero_stat_jobs', '500+', 'Jobs Stat', 'text'),
  ('hero_available_text', 'Technicians Available Now', 'Available Text', 'text'),
  ('footer_note', 'Serving Jeddah, Saudi Arabia', 'Footer Note', 'text'),
  ('company_tagline', 'Professional smart-home services for Jeddah residents', 'Company Tagline', 'text'),
  ('contact_whatsapp', '+966542418449', 'WhatsApp Contact', 'text')
ON CONFLICT (key) DO NOTHING;

-- Seed admin user (only if not already present)
INSERT INTO users (full_name, email, role) VALUES
  ('fixosmart', 'admin@fixosmart.com', 'admin')
ON CONFLICT DO NOTHING;
