import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const services = await storage.getServices();
  if (services.length === 0) {
    // Seed Services
    await db.insert(schema.services).values([
      { nameBn: "এসি মেরামত", nameEn: "AC Repair", nameAr: "إصلاح مكيفات الهواء", category: "AC", priceSar: "150", imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&h=500&fit=crop" },
      { nameBn: "বৈদ্যুতিক কাজ", nameEn: "Electrical Work", nameAr: "أعمال كهربائية", category: "Electric", priceSar: "100", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&h=500&fit=crop" },
      { nameBn: "প্লাম্বিং", nameEn: "Plumbing", nameAr: "سباكة", category: "Plumbing", priceSar: "120", imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&h=500&fit=crop" },
      { nameBn: "স্মার্ট হোম সেটআপ", nameEn: "Smart Home Setup", nameAr: "إعداد المنزل الذكي", category: "Smart Home", priceSar: "200", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&h=500&fit=crop" },
    ]);
  }

  const products = await storage.getProducts();
  if (products.length === 0) {
    // Seed Products
    await db.insert(schema.products).values([
      { nameBn: "স্মার্ট লক", nameEn: "Smart Lock", nameAr: "قفل ذكي", priceSar: "450", installationFeeSar: "99", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&h=500&fit=crop" },
      { nameBn: "সিসিটিভি ক্যামেরা", nameEn: "CCTV Camera", nameAr: "كاميرا مراقبة", priceSar: "300", installationFeeSar: "99", imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&h=500&fit=crop" },
      { nameBn: "স্মার্ট বাল্ব", nameEn: "Smart Bulb", nameAr: "لمبة ذكية", priceSar: "50", installationFeeSar: "0", imageUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&h=500&fit=crop" },
    ]);
  }
}

import { db } from "./db";
import * as schema from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getOrCreateUserByFullName(input.fullName);
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post(api.bookings.create.path, async (req, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const booking = await storage.createBooking(input);
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.bookings.list.path, async (req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.post(api.iqama.create.path, async (req, res) => {
    try {
      const input = api.iqama.create.input.parse(req.body);
      const tracker = await storage.createIqamaTracker(input);
      res.status(201).json(tracker);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.iqama.list.path, async (req, res) => {
    const trackers = await storage.getIqamaTrackers();
    res.json(trackers);
  });

  app.delete(api.iqama.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    await storage.deleteIqamaTracker(id);
    res.status(204).send();
  });

  // Call seed in the background
  seedDatabase().catch(console.error);

  return httpServer;
}
