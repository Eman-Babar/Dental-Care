# DentalCare — Clinic Website & Appointment System

Modern dental clinic web presence with public appointment requests, role-based dashboards (Admin / Doctor / Patient), CMS branding, contact form, chatbot, and email notifications.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, React Router
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT + role-based access (password reset supported)
- **Email:** Nodemailer (clinic alerts, patient status, contact form, password setup)

## Features

| Requirement | Status |
|---|---|
| Public pages + booking + CMS branding | Done |
| Contact form, password reset, doctor signup locked | Done |
| Review moderation, SEO, branded emails | Done |
| Payment / deposit status on appointments | Done |
| Email reminders (hourly) + WhatsApp remind link | Done |
| Helmet + rate limits (auth / contact / chat) | Done |
| Admin CSV export + payment overview stats | Done |
| CMS-driven FAQ (`faq.items` JSON) | Done |
| LICENSE (MIT + commercial note) | Done |
| Deposit instructions (JazzCash/bank CMS) | Done |
| Optional Stripe Checkout for deposits | Done |
| Printable receipt + patient “I’ve paid” claim | Done |
| Daily clinic digest email | Done |
| Admin clinic backup JSON + image upload | Done |
| PWA manifest (Add to Home Screen) | Done |
| Docker Compose for API | Done |
| Admin nav badges (pending + payment claims) | Done |
| Clinic holiday dates block booking (`clinic.closedDates`) | Done |
| Doctor visit notes on complete | Done |
| Patient cancel/reschedule emails clinic | Done |
| Review CTA email after completed visit | Done |
| Admin 14-day trend analytics | Done |
| Maintenance mode (CMS) pauses booking | Done |
| GitHub Actions CI (client build + Prisma) | Done |

## Selling / deploy checklist

1. Change brand, contact, FAQ, and OG image under **Admin → Site content**
2. Create doctors only from **Admin → Doctors** (public doctor signup is locked)
3. Set strong `JWT_SECRET`, real SMTP, and production `CLIENT_ORIGINS`
4. Local frontend: `VITE_API_URL=/api` (Vite proxy). Vercel: set `VITE_API_URL` to your Render `/api` URL and redeploy
5. Export appointments anytime from **Admin → Appointments → Export CSV**
6. Download a full clinic JSON backup from **Admin → Overview** before handover
7. Set holiday closures under Site content → `clinic.closedDates` as JSON, e.g. `["2026-08-14","2026-12-25"]`
8. Pause booking anytime: Site content → `site.maintenance` = `true`
9. Review LICENSE / replace with your commercial client agreement when selling a customized build

## Setup

### 1. Database

Create a PostgreSQL database (local or Neon/Supabase). Copy env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in `server/.env`:

- `DATABASE_URL` / `DATABASE_URL_DIRECT`
- `JWT_SECRET` (strong random string — required)
- `CLIENT_URL` / `CLIENT_ORIGINS` (e.g. `http://localhost:5173`, plus your Vercel URL in production)
- Email SMTP + `CLINIC_EMAIL`

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Backend

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

API runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Demo logins (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admingmail | ******* |
| Doctor | doctorgmail | ******** |
| Patient | patient@dentalcare.com | patient123 |

## Key URLs

- Public site: `/`, `/about`, `/services`, `/appointment`, `/doctors`, `/contact`
- Password reset: `/forgot-password`
- Admin appointments: `/admin/appointments`
- Site CMS (brand + copy): `/admin/content`
- Admin doctors: `/admin/doctors` (create staff here)

## Public booking flow

1. Visitor submits `/appointment` (no login required).
2. If the email is new, they receive a **set password** email for the patient portal.
3. Request appears in **Admin → Appointments**.
4. Clinic inbox receives an email (`CLINIC_EMAIL`).
5. Admin can **Confirm**, **Decline**, or **Mark handled**, and assign a doctor.

## White-label tip

Change **Clinic brand name**, tagline, contact details, and SEO description under **Admin → Site content**. Navbar, emails, chatbot, and SEO titles follow `home.brand`.

## Production build

```bash
# client
cd client && npm run build
# serve the `dist/` folder behind nginx / static host (or Vercel)

# server
cd server && npm start
```

Set production `CLIENT_ORIGINS` to your live frontend URL(s) and `VITE_API_URL` to your API `/api` base.

## Docker (API only)

With `server/.env` filled (Neon/Postgres + SMTP):

```bash
docker compose up --build -d
```

API on `http://localhost:5000`. Host the Vite `client/dist` on Vercel or nginx. Set `TZ=Asia/Karachi` for morning digests. Disable with `DIGEST_ENABLED=false` / `REMINDERS_ENABLED=false`.
