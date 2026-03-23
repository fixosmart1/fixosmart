import { db } from "./db";
import { eq, desc, sql, avg } from "drizzle-orm";
import {
  users, services, products, bookings, technicians,
  reviews, iqamaTrackers, subscriptions, promoCodes, siteSettings,
  technicianVerifications, serviceAddons,
  type User, type InsertUser,
  type Service, type InsertService,
  type ServiceAddon, type InsertServiceAddon,
  type Product, type InsertProduct,
  type Booking, type InsertBooking,
  type Technician, type InsertTechnician,
  type TechnicianVerification, type InsertTechnicianVerification,
  type Review, type InsertReview,
  type IqamaTracker, type InsertIqamaTracker,
  type Subscription, type InsertSubscription,
  type PromoCode, type InsertPromoCode,
  type SiteSetting,
} from "@shared/schema";

export interface IStorage {
  // USERS
  getUser(id: number): Promise<User | undefined>;
  getOrCreateUserByFullName(fullName: string, role?: string, email?: string): Promise<User>;
  updateUser(id: number, data: Partial<Pick<InsertUser, 'fullName' | 'email' | 'phone' | 'profilePhoto' | 'language' | 'verificationStatus' | 'referralCode' | 'referredBy' | 'discountAvailable' | 'walletBalance'>>): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  getReferralCount(referralCode: string): Promise<number>;
  addWalletBalance(userId: number, amount: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User>;
  suspendUser(id: number, suspended: boolean): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // SERVICES
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, data: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;
  // SERVICE ADD-ONS
  getServiceAddons(serviceId: number): Promise<ServiceAddon[]>;
  createServiceAddon(addon: InsertServiceAddon): Promise<ServiceAddon>;
  updateServiceAddon(id: number, data: Partial<InsertServiceAddon>): Promise<ServiceAddon>;
  deleteServiceAddon(id: number): Promise<void>;
  // REVIEWS BY SERVICE
  getReviewsByServiceId(serviceId: number): Promise<any[]>;

  // PRODUCTS
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // BOOKINGS
  getBookings(userId?: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  getAllBookingsWithUsers(): Promise<any[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  assignTechnicianToBooking(bookingId: number, technicianId: number | null): Promise<Booking>;
  getTechnicianBookings(technicianId: number): Promise<Booking[]>;
  getTechnicianBookingsWithUsers(technicianId: number): Promise<any[]>;

  // TECHNICIANS
  getTechnicians(): Promise<any[]>;
  getTechnicianById(id: number): Promise<any | undefined>;
  getTechnicianByUserId(userId: number): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  getAllTechniciansWithUsers(): Promise<any[]>;
  updateTechnicianRating(technicianId: number): Promise<void>;

  // VERIFICATION
  getVerificationByUserId(userId: number): Promise<TechnicianVerification | undefined>;
  getAllVerifications(): Promise<any[]>;
  createVerification(data: InsertTechnicianVerification): Promise<TechnicianVerification>;
  updateVerification(id: number, data: Partial<TechnicianVerification>): Promise<TechnicianVerification>;

  // REVIEWS
  getReviews(): Promise<Review[]>;
  getReviewsByTechnicianId(technicianId: number): Promise<Review[]>;
  hasReviewedBooking(userId: number, bookingId: number): Promise<boolean>;
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
  getAnalytics(): Promise<{ totalBookings: number; totalRevenue: number; totalUsers: number; totalTechnicians: number; pendingBookings: number; completedBookings: number; pendingVerifications: number }>;

  // SITE SETTINGS
  getSiteSettings(): Promise<SiteSetting[]>;
  upsertSiteSetting(key: string, value: string): Promise<SiteSetting>;
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

  async updateUser(id: number, data: Partial<Pick<InsertUser, 'fullName' | 'email' | 'phone' | 'profilePhoto' | 'language' | 'verificationStatus' | 'referralCode' | 'referredBy' | 'discountAvailable'>>) {
    const [u] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return u;
  }

  async getUserByEmail(email: string) {
    const [u] = await db.select().from(users).where(eq(users.email, email));
    return u;
  }

  async getUserByReferralCode(code: string) {
    const [u] = await db.select().from(users).where(eq(users.referralCode, code));
    return u;
  }

  async getReferralCount(referralCode: string) {
    const result = await db.select().from(users).where(eq(users.referredBy, referralCode));
    return result.length;
  }

  async addWalletBalance(userId: number, amount: number) {
    const user = await this.getUser(userId);
    if (!user) return;
    const current = parseFloat(user.walletBalance || "0");
    await db.update(users).set({ walletBalance: (current + amount).toFixed(2) }).where(eq(users.id, userId));
  }

  async getAllUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: number, role: string) {
    const [u] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return u;
  }

  async suspendUser(id: number, suspended: boolean) {
    const [u] = await db.update(users).set({ suspended }).where(eq(users.id, id)).returning();
    return u;
  }

  async deleteUser(id: number) {
    await db.delete(users).where(eq(users.id, id));
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

  async getServiceAddons(serviceId: number) {
    return db.select().from(serviceAddons).where(eq(serviceAddons.serviceId, serviceId));
  }
  async createServiceAddon(addon: InsertServiceAddon) {
    const [a] = await db.insert(serviceAddons).values(addon).returning();
    return a;
  }
  async updateServiceAddon(id: number, data: Partial<InsertServiceAddon>) {
    const [a] = await db.update(serviceAddons).set(data).where(eq(serviceAddons.id, id)).returning();
    return a;
  }
  async deleteServiceAddon(id: number) {
    await db.delete(serviceAddons).where(eq(serviceAddons.id, id));
  }
  async getReviewsByServiceId(serviceId: number) {
    const all = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
    const serviceBookings = await db.select().from(bookings).where(eq(bookings.serviceId, serviceId));
    const bookingIds = serviceBookings.map(b => b.id);
    return all.filter(r => r.bookingId && bookingIds.includes(r.bookingId));
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

  async getAllBookingsWithUsers() {
    const allBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    const userIds = [...new Set(allBookings.map(b => b.userId).filter(Boolean))] as number[];
    const userList = userIds.length > 0
      ? await db.select().from(users).where(sql`${users.id} = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      : [];
    const userMap = Object.fromEntries(userList.map(u => [u.id, u]));
    return allBookings.map(b => {
      const customer = b.userId ? userMap[b.userId] : null;
      return {
        ...b,
        customerName: customer?.fullName || 'Guest',
        customerPhone: customer?.phone || null,
        customerEmail: customer?.email || null,
      };
    });
  }

  async createBooking(booking: InsertBooking) {
    const [b] = await db.insert(bookings).values(booking).returning();
    return b;
  }

  async updateBookingStatus(id: number, status: string) {
    const [b] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return b;
  }

  async assignTechnicianToBooking(bookingId: number, technicianId: number | null) {
    const [b] = await db.update(bookings).set({ technicianId }).where(eq(bookings.id, bookingId)).returning();
    return b;
  }

  async getTechnicianBookings(technicianId: number) {
    return db.select().from(bookings).where(eq(bookings.technicianId, technicianId)).orderBy(desc(bookings.createdAt));
  }

  async getTechnicianBookingsWithUsers(technicianId: number) {
    const jobs = await db.select().from(bookings).where(eq(bookings.technicianId, technicianId)).orderBy(desc(bookings.createdAt));
    const userIds = [...new Set(jobs.map(j => j.userId).filter(Boolean))] as number[];
    const userList = userIds.length > 0
      ? await db.select().from(users).where(sql`${users.id} = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      : [];
    const userMap = Object.fromEntries(userList.map(u => [u.id, u]));
    return jobs.map(j => {
      const customer = j.userId ? userMap[j.userId] : null;
      return {
        ...j,
        customerName: customer?.fullName || 'Guest',
        customerPhone: customer?.phone || null,
        customerEmail: customer?.email || null,
      };
    });
  }

  async getTechnicians() {
    const techs = await db.select().from(technicians);
    const userIds = [...new Set(techs.map(t => t.userId))];
    const userList = userIds.length > 0
      ? await db.select().from(users).where(sql`${users.id} = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      : [];
    const userMap = Object.fromEntries(userList.map(u => [u.id, u]));
    return techs.map(t => ({ ...t, user: userMap[t.userId] || null }));
  }

  async getTechnicianById(id: number) {
    const [t] = await db.select().from(technicians).where(eq(technicians.id, id));
    if (!t) return undefined;
    const user = await this.getUser(t.userId);
    const techReviews = await this.getReviewsByTechnicianId(t.id);
    return { ...t, user, reviews: techReviews };
  }

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
    const userIds = [...new Set(techs.map(t => t.userId))];
    const userList = userIds.length > 0
      ? await db.select().from(users).where(sql`${users.id} = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      : [];
    const userMap = Object.fromEntries(userList.map(u => [u.id, u]));
    return techs.map(t => ({ ...t, user: userMap[t.userId] || null }));
  }

  async updateTechnicianRating(technicianId: number) {
    const techReviews = await db.select().from(reviews).where(eq(reviews.technicianId, technicianId));
    if (techReviews.length === 0) return;
    const avgRating = techReviews.reduce((sum, r) => sum + r.rating, 0) / techReviews.length;
    await db.update(technicians)
      .set({ rating: avgRating.toFixed(2), totalJobs: techReviews.length })
      .where(eq(technicians.id, technicianId));
  }

  // VERIFICATION
  async getVerificationByUserId(userId: number) {
    const [v] = await db.select().from(technicianVerifications).where(eq(technicianVerifications.userId, userId));
    return v;
  }

  async getAllVerifications() {
    const verifs = await db.select().from(technicianVerifications).orderBy(desc(technicianVerifications.createdAt));
    const userIds = [...new Set(verifs.map(v => v.userId))];
    const userList = userIds.length > 0
      ? await db.select().from(users).where(sql`${users.id} = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      : [];
    const userMap = Object.fromEntries(userList.map(u => [u.id, u]));
    return verifs.map(v => ({ ...v, user: userMap[v.userId] || null }));
  }

  async createVerification(data: InsertTechnicianVerification) {
    const [v] = await db.insert(technicianVerifications).values(data).returning();
    return v;
  }

  async updateVerification(id: number, data: Partial<TechnicianVerification>) {
    const [v] = await db.update(technicianVerifications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(technicianVerifications.id, id))
      .returning();
    return v;
  }

  async getReviews() { return db.select().from(reviews).orderBy(desc(reviews.createdAt)); }

  async getReviewsByTechnicianId(technicianId: number) {
    return db.select().from(reviews).where(eq(reviews.technicianId, technicianId)).orderBy(desc(reviews.createdAt));
  }

  async hasReviewedBooking(userId: number, bookingId: number) {
    const [r] = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId));
    return !!r && r.userId === userId;
  }

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
    const allVerifs = await db.select().from(technicianVerifications);
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
      pendingVerifications: allVerifs.filter(v => ['pending', 'under_review'].includes(v.status || '')).length,
    };
  }

  async getSiteSettings() {
    return db.select().from(siteSettings);
  }

  async upsertSiteSetting(key: string, value: string) {
    const [s] = await db.insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } })
      .returning();
    return s;
  }
}

export const storage = new DatabaseStorage();
