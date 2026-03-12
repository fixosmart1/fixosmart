import { z } from 'zod';
import { 
  users, services, products, bookings, technicians,
  reviews, iqamaTrackers, subscriptions, promoCodes,
  insertBookingSchema, insertIqamaTrackerSchema,
  insertReviewSchema, insertTechnicianSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

const UserSchema = z.custom<typeof users.$inferSelect>();
const ServiceSchema = z.custom<typeof services.$inferSelect>();
const ProductSchema = z.custom<typeof products.$inferSelect>();
const BookingSchema = z.custom<typeof bookings.$inferSelect>();
const TechnicianSchema = z.custom<typeof technicians.$inferSelect>();
const ReviewSchema = z.custom<typeof reviews.$inferSelect>();
const IqamaSchema = z.custom<typeof iqamaTrackers.$inferSelect>();
const SubscriptionSchema = z.custom<typeof subscriptions.$inferSelect>();
const PromoCodeSchema = z.custom<typeof promoCodes.$inferSelect>();

export const api = {
  auth: {
    me: { method: 'GET' as const, path: '/api/me' as const, responses: { 200: UserSchema.nullable() } },
    login: {
      method: 'POST' as const, path: '/api/login' as const,
      input: z.object({ fullName: z.string(), email: z.string().optional(), role: z.string().optional() }),
      responses: { 200: UserSchema }
    },
    logout: { method: 'POST' as const, path: '/api/logout' as const, responses: { 200: z.object({ ok: z.boolean() }) } }
  },
  services: {
    list: { method: 'GET' as const, path: '/api/services' as const, responses: { 200: z.array(ServiceSchema) } },
    create: { method: 'POST' as const, path: '/api/services' as const, input: z.any(), responses: { 201: ServiceSchema } },
    update: { method: 'PUT' as const, path: '/api/services/:id' as const, input: z.any(), responses: { 200: ServiceSchema } },
    delete: { method: 'DELETE' as const, path: '/api/services/:id' as const, responses: { 204: z.void() } }
  },
  products: {
    list: { method: 'GET' as const, path: '/api/products' as const, responses: { 200: z.array(ProductSchema) } },
    create: { method: 'POST' as const, path: '/api/products' as const, input: z.any(), responses: { 201: ProductSchema } },
    update: { method: 'PUT' as const, path: '/api/products/:id' as const, input: z.any(), responses: { 200: ProductSchema } },
    delete: { method: 'DELETE' as const, path: '/api/products/:id' as const, responses: { 204: z.void() } }
  },
  bookings: {
    list: { method: 'GET' as const, path: '/api/bookings' as const, responses: { 200: z.array(BookingSchema) } },
    listAll: { method: 'GET' as const, path: '/api/admin/bookings' as const, responses: { 200: z.array(BookingSchema) } },
    create: { method: 'POST' as const, path: '/api/bookings' as const, input: insertBookingSchema, responses: { 201: BookingSchema, 400: errorSchemas.validation } },
    updateStatus: { method: 'PATCH' as const, path: '/api/bookings/:id/status' as const, input: z.object({ status: z.string() }), responses: { 200: BookingSchema } },
  },
  technicians: {
    list: { method: 'GET' as const, path: '/api/technicians' as const, responses: { 200: z.array(TechnicianSchema) } },
    listAll: { method: 'GET' as const, path: '/api/admin/technicians' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/technicians' as const, input: insertTechnicianSchema, responses: { 201: TechnicianSchema } },
    myJobs: { method: 'GET' as const, path: '/api/technician/jobs' as const, responses: { 200: z.array(BookingSchema) } },
    myEarnings: { method: 'GET' as const, path: '/api/technician/earnings' as const, responses: { 200: z.object({ total: z.number(), monthly: z.number(), jobs: z.number() }) } },
    updateJob: { method: 'PATCH' as const, path: '/api/technician/jobs/:id' as const, input: z.object({ status: z.string() }), responses: { 200: BookingSchema } },
  },
  reviews: {
    create: { method: 'POST' as const, path: '/api/reviews' as const, input: insertReviewSchema, responses: { 201: ReviewSchema } },
    list: { method: 'GET' as const, path: '/api/reviews' as const, responses: { 200: z.array(ReviewSchema) } },
  },
  iqama: {
    list: { method: 'GET' as const, path: '/api/iqama' as const, responses: { 200: z.array(IqamaSchema) } },
    create: { method: 'POST' as const, path: '/api/iqama' as const, input: insertIqamaTrackerSchema, responses: { 201: IqamaSchema, 400: errorSchemas.validation } },
    delete: { method: 'DELETE' as const, path: '/api/iqama/:id' as const, responses: { 204: z.void() } }
  },
  subscriptions: {
    list: { method: 'GET' as const, path: '/api/subscriptions' as const, responses: { 200: z.array(SubscriptionSchema) } },
  },
  promo: {
    validate: { method: 'POST' as const, path: '/api/promo/validate' as const, input: z.object({ code: z.string() }), responses: { 200: PromoCodeSchema, 404: errorSchemas.notFound } },
    listAll: { method: 'GET' as const, path: '/api/admin/promos' as const, responses: { 200: z.array(PromoCodeSchema) } },
    create: { method: 'POST' as const, path: '/api/admin/promos' as const, input: z.any(), responses: { 201: PromoCodeSchema } },
  },
  admin: {
    analytics: { method: 'GET' as const, path: '/api/admin/analytics' as const, responses: { 200: z.object({ totalBookings: z.number(), totalRevenue: z.number(), totalUsers: z.number(), totalTechnicians: z.number(), pendingBookings: z.number(), completedBookings: z.number() }) } },
    users: { method: 'GET' as const, path: '/api/admin/users' as const, responses: { 200: z.array(UserSchema) } },
    updateUserRole: { method: 'PATCH' as const, path: '/api/admin/users/:id/role' as const, input: z.object({ role: z.string() }), responses: { 200: UserSchema } },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}

// Re-export types
export type { User, Service, Product, Booking, Technician, Review, IqamaTracker, Subscription, PromoCode } from './schema';
