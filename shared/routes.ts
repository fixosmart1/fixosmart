import { z } from 'zod';
import { 
  insertUserSchema, users, 
  services, products, 
  insertBookingSchema, bookings,
  insertIqamaTrackerSchema, iqamaTrackers
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>().nullable(),
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({ fullName: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      }
    }
  },
  services: {
    list: {
      method: 'GET' as const,
      path: '/api/services' as const,
      responses: {
        200: z.array(z.custom<typeof services.$inferSelect>()),
      }
    }
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      }
    }
  },
  bookings: {
    create: {
      method: 'POST' as const,
      path: '/api/bookings' as const,
      input: insertBookingSchema,
      responses: {
        201: z.custom<typeof bookings.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/bookings' as const,
      responses: {
        200: z.array(z.custom<typeof bookings.$inferSelect>()),
      }
    }
  },
  iqama: {
    create: {
      method: 'POST' as const,
      path: '/api/iqama' as const,
      input: insertIqamaTrackerSchema,
      responses: {
        201: z.custom<typeof iqamaTrackers.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/iqama' as const,
      responses: {
        200: z.array(z.custom<typeof iqamaTrackers.$inferSelect>()),
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/iqama/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
