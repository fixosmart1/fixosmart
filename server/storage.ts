import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users, services, products, bookings, iqamaTrackers,
  type User, type InsertUser,
  type Service, type InsertService,
  type Product, type InsertProduct,
  type Booking, type InsertBooking,
  type IqamaTracker, type InsertIqamaTracker
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getOrCreateUserByFullName(fullName: string): Promise<User>;
  
  getServices(): Promise<Service[]>;
  getProducts(): Promise<Product[]>;
  
  getBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  
  getIqamaTrackers(): Promise<IqamaTracker[]>;
  createIqamaTracker(tracker: InsertIqamaTracker): Promise<IqamaTracker>;
  deleteIqamaTracker(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getOrCreateUserByFullName(fullName: string): Promise<User> {
    const [existing] = await db.select().from(users).where(eq(users.fullName, fullName));
    if (existing) return existing;

    const [newUser] = await db.insert(users).values({ fullName }).returning();
    return newUser;
  }

  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getIqamaTrackers(): Promise<IqamaTracker[]> {
    return await db.select().from(iqamaTrackers);
  }

  async createIqamaTracker(tracker: InsertIqamaTracker): Promise<IqamaTracker> {
    const [newTracker] = await db.insert(iqamaTrackers).values(tracker).returning();
    return newTracker;
  }

  async deleteIqamaTracker(id: number): Promise<void> {
    await db.delete(iqamaTrackers).where(eq(iqamaTrackers.id, id));
  }
}

export const storage = new DatabaseStorage();
