import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import {
  users, services, products, bookings, technicians,
  reviews, iqamaTrackers, subscriptions, promoCodes,
  type User, type InsertUser,
  type Service, type InsertService,
  type Product, type InsertProduct,
  type Booking, type InsertBooking,
  type Technician, type InsertTechnician,
  type Review, type InsertReview,
  type IqamaTracker, type InsertIqamaTracker,
  type Subscription, type InsertSubscription,
  type PromoCode, type InsertPromoCode,
} from "@shared/schema";

export interface IStorage {
  // USERS
  getUser(id: number): Promise<User | undefined>;
  getOrCreateUserByFullName(fullName: string, role?: string, email?: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User>;

  // SERVICES
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, data: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // PRODUCTS
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // BOOKINGS
  getBookings(userId?: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  getTechnicianBookings(technicianId: number): Promise<Booking[]>;

  // TECHNICIANS
  getTechnicians(): Promise<Technician[]>;
  getTechnicianByUserId(userId: number): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  getAllTechniciansWithUsers(): Promise<any[]>;

  // REVIEWS
  getReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // IQAMA
  getIqamaTrackers(userId?: number): Promise<IqamaTracker[]>;
  createIqamaTracker(tracker: InsertIqamaTracker): Promise<IqamaTracker>;
  deleteIqamaTracker(id: number): Promise<void>;

  // SUBSCRIPTIONS
  getSubscriptions(userId?: number): Promise<Subscription[]>;

  // PROMO CODES
  validatePromoCode(code: string): Promise<PromoCode | undefined>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  createPromoCode(promo: InsertPromoCode): Promise<PromoCode>;

  // ANALYTICS
  getAnalytics(): Promise<{ totalBookings: number; totalRevenue: number; totalUsers: number; totalTechnicians: number; pendingBookings: number; completedBookings: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  }

  async getOrCreateUserByFullName(fullName: string, role?: string, email?: string) {
    const where = email
      ? await db.select().from(users).where(eq(users.email, email))
      : await db.select().from(users).where(eq(users.fullName, fullName));
    if (where.length > 0) return where[0];
    const [u] = await db.insert(users).values({ fullName, role: role || "customer", email }).returning();
    return u;
  }

  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: number, role: string) {
    const [u] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return u;
  }

  async getServices() { return db.select().from(services); }

  async createService(service: InsertService) {
    const [s] = await db.insert(services).values(service).returning();
    return s;
  }

  async updateService(id: number, data: Partial<InsertService>) {
    const [s] = await db.update(services).set(data).where(eq(services.id, id)).returning();
    return s;
  }

  async deleteService(id: number) {
    await db.delete(services).where(eq(services.id, id));
  }

  async getProducts() { return db.select().from(products); }

  async createProduct(product: InsertProduct) {
    const [p] = await db.insert(products).values(product).returning();
    return p;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>) {
    const [p] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return p;
  }

  async deleteProduct(id: number) {
    await db.delete(products).where(eq(products.id, id));
  }

  async getBookings(userId?: number) {
    if (userId) return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getAllBookings() {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async createBooking(booking: InsertBooking) {
    const [b] = await db.insert(bookings).values(booking).returning();
    return b;
  }

  async updateBookingStatus(id: number, status: string) {
    const [b] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return b;
  }

  async getTechnicianBookings(technicianId: number) {
    return db.select().from(bookings).where(eq(bookings.technicianId, technicianId)).orderBy(desc(bookings.createdAt));
  }

  async getTechnicians() { return db.select().from(technicians); }

  async getTechnicianByUserId(userId: number) {
    const [t] = await db.select().from(technicians).where(eq(technicians.userId, userId));
    return t;
  }

  async createTechnician(technician: InsertTechnician) {
    const [t] = await db.insert(technicians).values(technician).returning();
    return t;
  }

  async getAllTechniciansWithUsers() {
    const techs = await db.select().from(technicians);
    const result = [];
    for (const t of techs) {
      const user = await this.getUser(t.userId);
      result.push({ ...t, user });
    }
    return result;
  }

  async getReviews() { return db.select().from(reviews).orderBy(desc(reviews.createdAt)); }

  async createReview(review: InsertReview) {
    const [r] = await db.insert(reviews).values(review).returning();
    return r;
  }

  async getIqamaTrackers(userId?: number) {
    if (userId) return db.select().from(iqamaTrackers).where(eq(iqamaTrackers.userId, userId));
    return db.select().from(iqamaTrackers);
  }

  async createIqamaTracker(tracker: InsertIqamaTracker) {
    const [t] = await db.insert(iqamaTrackers).values(tracker).returning();
    return t;
  }

  async deleteIqamaTracker(id: number) {
    await db.delete(iqamaTrackers).where(eq(iqamaTrackers.id, id));
  }

  async getSubscriptions(userId?: number) {
    if (userId) return db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return db.select().from(subscriptions);
  }

  async validatePromoCode(code: string) {
    const [p] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
    if (!p || !p.isActive) return undefined;
    return p;
  }

  async getAllPromoCodes() { return db.select().from(promoCodes); }

  async createPromoCode(promo: InsertPromoCode) {
    const [p] = await db.insert(promoCodes).values(promo).returning();
    return p;
  }

  async getAnalytics() {
    const allBookings = await db.select().from(bookings);
    const allUsers = await db.select().from(users);
    const allTechs = await db.select().from(technicians);
    const totalRevenue = allBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.totalAmountSar || 0), 0);
    return {
      totalBookings: allBookings.length,
      totalRevenue,
      totalUsers: allUsers.filter(u => u.role === 'customer').length,
      totalTechnicians: allTechs.length,
      pendingBookings: allBookings.filter(b => b.status === 'pending').length,
      completedBookings: allBookings.filter(b => b.status === 'completed').length,
    };
  }
}

export const storage = new DatabaseStorage();
