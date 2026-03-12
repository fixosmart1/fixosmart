# FixoSmart — Smart Home Maintenance Marketplace

## Project Overview
FixoSmart is a trilingual (EN/BN/AR) smart home maintenance and repair marketplace for Jeddah, Saudi Arabia. It connects Bangladeshi expat customers with certified technicians for home services, while also selling smart home gadgets.

## Tech Stack
- **Frontend**: React + TypeScript + TailwindCSS + Framer Motion + Wouter
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Simple session-based (cookie + in-memory Map)

## Architecture
- `shared/schema.ts` — Drizzle ORM table definitions + Zod schemas
- `shared/routes.ts` — Full API contract (typed endpoints)
- `server/storage.ts` — DatabaseStorage class with all CRUD operations
- `server/routes.ts` — Express route handlers + DB seed function
- `client/src/` — React frontend

## Key Features
- **Multilingual**: EN / BN / AR with RTL support for Arabic
- **Role-based auth**: customer, technician, admin — login via Profile page
- **Customer App**: Home, Dashboard, Services, Products, Booking (3-step), Expat Tools
- **Technician Panel**: Dashboard, Jobs (with status workflow), Earnings
- **Admin Dashboard**: Analytics, Users (role mgmt), Bookings (status mgmt), Services CRUD, Products CRUD
- **Booking System**: 3-step flow, promo codes, WhatsApp share, emergency SOS mode
- **Expat Tools**: Iqama tracker, SAR→BDT currency converter, prayer times, weather
- **SOS Button**: Floating red button (customers only), routes to emergency booking
- **Subscription Plans**: Basic 49 SAR, Pro 99 SAR, Elite 199 SAR
- **Referral System**: FIXO{userId} codes shown in profile

## Routes
### Customer
- `/` Home, `/dashboard` Customer Dashboard, `/services` Services list
- `/products` Products marketplace, `/booking` Booking flow
- `/expat-tools` Expat utilities, `/profile` Login/Profile

### Technician
- `/technician/dashboard`, `/technician/jobs`, `/technician/earnings`

### Admin
- `/admin`, `/admin/users`, `/admin/bookings`, `/admin/services`, `/admin/products`

## API Endpoints
- `GET/POST /api/me` — Auth
- `POST /api/login`, `POST /api/logout`
- `GET/POST /api/services`, `PUT/DELETE /api/services/:id`
- `GET/POST /api/products`, `PUT/DELETE /api/products/:id`
- `GET/POST /api/bookings`, `PATCH /api/bookings/:id/status`
- `GET /api/technicians`, `GET/PATCH /api/technician/jobs/:id`
- `GET /api/technician/earnings`
- `GET/POST /api/iqama`, `DELETE /api/iqama/:id`
- `POST /api/promo/validate`
- `GET /api/admin/analytics`, `GET /api/admin/users`
- `GET /api/admin/bookings`, `GET /api/admin/technicians`

## Database Tables
users, technicians, services, products, bookings, reviews, iqamaTrackers, subscriptions, promoCodes

## Seeded Data
- 6 services (AC, Electric, Plumbing, Smart Home, CCTV, Appliance)
- 4 products (Smart Lock, CCTV Camera, Smart Bulb, Smart Doorbell)
- 3 promo codes: WELCOME10 (10%), EXPAT20 (20%), JEDDAH15 (15%)
- Admin user + Mohammed Al-Harbi (technician, AC specialist)

## Design System
- Primary Blue: #1E40AF (hsl 221 83% 40%)
- Success Green: #16A34A (hsl 142 76% 36%)
- Gold: #FBBF24 (hsl 45 93% 47%)
- Dark bg: hsl(222 47% 7%)
- `.glass` class: backdrop-blur card panels
- `.sos-pulse` animation on SOS button
- Dark mode supported via CSS variables + ThemeToggle

## Running
```
npm install
npm run db:push
npm run dev
```
