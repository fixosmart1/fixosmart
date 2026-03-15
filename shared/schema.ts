import { pgTable, text, serial, integer, numeric, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// USERS — extended with role, suspension, profile photo, verification status
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").default("customer"), // customer | technician | admin
  language: text("language").default("en"),
  iqamaExpiry: date("iqama_expiry"),
  city: text("city").default("Jeddah"),
  referralCode: text("referral_code"),
  referredBy: text("referred_by"),
  profilePhoto: text("profile_photo"),
  suspended: boolean("suspended").default(false),
  verificationStatus: text("verification_status"), // null | pending | under_review | approved | rejected
  discountAvailable: boolean("discount_available").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// TECHNICIANS — extended profile
export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  specialization: text("specialization").notNull(),
  bio: text("bio"),
  rating: numeric("rating").default("0"),
  totalJobs: integer("total_jobs").default(0),
  isAvailable: boolean("is_available").default(true),
  hourlyRate: numeric("hourly_rate").default("0"),
  completionPhotoUrl: text("completion_photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// TECHNICIAN VERIFICATIONS — application submitted when a technician registers
export const technicianVerifications = pgTable("technician_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  // Personal info
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  // Professional info
  specialization: text("specialization").notNull(),
  yearsExperience: integer("years_experience").default(0),
  skills: text("skills").array(),
  bio: text("bio"),
  // Documents (URLs — technician uploads to cloud and pastes URL)
  govIdUrl: text("gov_id_url"),
  workCertUrl: text("work_cert_url"),
  portfolioUrls: text("portfolio_urls").array(),
  profilePhotoUrl: text("profile_photo_url"),
  videoUrl: text("video_url"),
  // Verification state
  status: text("status").default("pending"), // pending | under_review | approved | rejected
  adminNotes: text("admin_notes"),
  // Admin quality scores (1-5)
  scoreExperience: integer("score_experience"),
  scorePortfolio: integer("score_portfolio"),
  scoreDocument: integer("score_document"),
  scoreCommunication: integer("score_communication"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SERVICES
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  category: text("category").notNull(),
  priceSar: numeric("price_sar").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
});

// PRODUCTS
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  priceSar: numeric("price_sar").notNull(),
  installationFeeSar: numeric("installation_fee_sar").default('99'),
  affiliateLink: text("affiliate_link"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
});

// BOOKINGS
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  technicianId: integer("technician_id").references(() => technicians.id),
  serviceId: integer("service_id").references(() => services.id),
  productId: integer("product_id").references(() => products.id),
  bookingDate: date("booking_date").notNull(),
  bookingTime: text("booking_time").notNull(),
  district: text("district").notNull(),
  city: text("city").default("Jeddah"),
  address: text("address").notNull(),
  notes: text("notes"),
  status: text("status").default("pending"),
  totalAmountSar: numeric("total_amount_sar"),
  promoCode: text("promo_code"),
  discountSar: numeric("discount_sar").default("0"),
  languagePreference: text("language_preference").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

// REVIEWS
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  userId: integer("user_id").references(() => users.id),
  technicianId: integer("technician_id").references(() => technicians.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// IQAMA TRACKERS
export const iqamaTrackers = pgTable("iqama_trackers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  iqamaNumber: text("iqama_number").notNull(),
  expiryDate: date("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// SUBSCRIPTIONS
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  planName: text("plan_name").notNull(),
  priceSar: numeric("price_sar").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// PROMO CODES
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  maxUses: integer("max_uses").default(100),
  usedCount: integer("used_count").default(0),
  expiryDate: date("expiry_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SITE SETTINGS
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  label: text("label"),
  type: text("type").default("text"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// ===================== SCHEMAS =====================
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTechnicianSchema = createInsertSchema(technicians).omit({ id: true, createdAt: true });
export const insertTechnicianVerificationSchema = createInsertSchema(technicianVerifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertIqamaTrackerSchema = createInsertSchema(iqamaTrackers).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({ id: true, createdAt: true });

// ===================== TYPES =====================
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;

export type TechnicianVerification = typeof technicianVerifications.$inferSelect;
export type InsertTechnicianVerification = z.infer<typeof insertTechnicianVerificationSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type IqamaTracker = typeof iqamaTrackers.$inferSelect;
export type InsertIqamaTracker = z.infer<typeof insertIqamaTrackerSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
