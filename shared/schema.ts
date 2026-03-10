import { pgTable, text, serial, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  language: text("language").default("en"),
  iqamaExpiry: date("iqama_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  category: text("category").notNull(), // AC, Electric, Plumbing, Smart Home
  priceSar: numeric("price_sar").notNull(),
  imageUrl: text("image_url"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  nameBn: text("name_bn").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  priceSar: numeric("price_sar").notNull(),
  installationFeeSar: numeric("installation_fee_sar").default('99'),
  affiliateLink: text("affiliate_link"),
  imageUrl: text("image_url"),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  serviceId: integer("service_id").references(() => services.id),
  productId: integer("product_id").references(() => products.id),
  bookingDate: date("booking_date").notNull(),
  bookingTime: text("booking_time").notNull(),
  district: text("district").notNull(),
  address: text("address").notNull(),
  status: text("status").default("pending"),
  totalAmountSar: numeric("total_amount_sar"),
  languagePreference: text("language_preference").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const iqamaTrackers = pgTable("iqama_trackers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  iqamaNumber: text("iqama_number").notNull(),
  expiryDate: date("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Basic Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, status: true });
export const insertIqamaTrackerSchema = createInsertSchema(iqamaTrackers).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type IqamaTracker = typeof iqamaTrackers.$inferSelect;
export type InsertIqamaTracker = z.infer<typeof insertIqamaTrackerSchema>;
