# DentalCare — Clinic Website & Appointment System

Modern dental clinic web presence with public appointment requests, role-based dashboards (Admin / Doctor / Patient), and a lightweight CMS for page copy.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, React Router
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT + role-based access
- **Email:** Nodemailer (clinic inbox notifications)

## Features (client brief)

| Requirement | Status |
|---|---|
| Public pages: Home, About, Services, Appointment, Contact (+ Doctors) | Done |
| Visitor appointment form → admin dashboard | Done |
| Email notification to clinic inbox | Done |
| Admin confirm / decline / mark handled | Done |
| CMS for headings, texts, images | Done (`/admin/content`) |
| Edit services & doctor bios without code | Done |
| Responsive healthcare UI | Done |
| Basic SEO (titles, meta, alt text) | Done |

## Setup

### 1. Database

Create a PostgreSQL database (local or Neon/Supabase). Copy env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill `DATABASE_URL`, `DATABASE_URL_DIRECT`, `JWT_SECRET`, and email settings in `server/.env`:

```env
CLINIC_EMAIL=clinic@yourdomain.com
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM="DentalCare <no-reply@dentalcare.com>"
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

Update `client/src/api/axios.js` `baseURL` if the API is hosted elsewhere.

## Demo logins (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admingmail.com | ******** |
| Doctor | doctorgmail.com | ******** |
| Patient | patientgmail.com | ******** |

## Key URLs

- Public site: `/home`, `/about`, `/services`, `/appointment`, `/doctors`, `/contact`
- Admin appointments: `/admin/appointments`
- Site CMS: `/admin/content`

## Public booking flow

1. Visitor submits `/appointment` (no login required).
2. Request appears in **Admin → Appointments** with timestamp.
3. Clinic inbox receives an email (`CLINIC_EMAIL`).
4. Admin can **Confirm**, **Decline**, or **Mark handled**, and assign a doctor.

## Production build

```bash
# client
cd client && npm run build
# serve the `dist/` folder behind nginx / static host

# server
cd server && npm start
```

## Maintenance notes

- Page headings / hero copy / contact details: Admin → **Site content**
- Service titles & descriptions: Admin → **Services**
- Doctor bios & images: Admin → **Doctors**
