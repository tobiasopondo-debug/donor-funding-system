# DonorConnect Kenya — Donor funding platform

A full-stack platform for **verified NGO fundraising** and **transparent donor giving**: organizations prove legitimacy before publishing projects; donors browse public listings, pay by card (**Stripe**, test-first), and see history tied to each project. **M-Pesa** (STK) exists in the codebase for KES flows but is still **experimental** compared to Stripe.

**Stack:** Next.js 15 (`frontend/`), NestJS (`backend/`), PostgreSQL (Prisma), MinIO (S3-compatible storage), Stripe Checkout + webhooks, Socket.IO (real-time chat), Docker Compose for local and container deployment.

For the original product narrative and module boundaries, see [`docs/product-story-and-modules.md`](docs/product-story-and-modules.md).

---

## Features at a glance

| Area | What you get |
|------|----------------|
| **Accounts** | Email + password; roles **Donor**, **NGO user**, **Platform admin**. Self-signup is donor or NGO only; admin is seeded. |
| **Email OTP (2FA)** | After register or login (except the seeded admin), a **6-digit code** is sent by **SMTP**; users complete sign-in on a second step. Configure mail in `backend/.env` (see [Environment](#environment)). |
| **NGO onboarding** | NGO user creates an **organization profile** (legal name, display name, mission, contact, location), uploads **verification documents** to MinIO, and stays **pending review** until an admin **approves** or **rejects**. |
| **Media** | NGOs can upload and replace **logo**, **banner**, and **gallery** images; **project images** for campaigns. Files live in MinIO; the API uses signed URLs where appropriate. |
| **Projects** | Approved NGOs create projects in **draft**, set **goal**, **currency**, optional **start/end dates**, description, then **publish** (or pause). Only **published** projects from **approved** orgs appear on the public site. |
| **Donations** | **Stripe Checkout** is the primary path for paying online; webhook updates donation status. **M-Pesa STK** appears in the UI for KES projects but needs Daraja credentials and a reachable callback URL — treat as **in development**. |
| **Donor dashboard** | Signed-in donors see **donation history** with amounts, status, and links to projects/orgs. |
| **Project updates** | NGOs can post **updates** on a project so supporters see progress over time. |
| **Organization chat** | **Real-time discussion** per NGO (Socket.IO): donors, NGO users, and admins can read and post when signed in; connection status is shown in the UI. |
| **Ratings & comments** | Donors can **rate** an organization (with an optional **comment**); aggregates and lists appear on public org views. |
| **Admin** | Queue of pending NGOs, document review, **approve / reject**, visibility of donations for support, reporting totals. |
| **Public site** | Marketing home, project and org listings, project detail with donate box, success/cancel return URLs after Stripe. |
| **“Live” activity** | Chat messages appear in **real time** over websockets; M-Pesa flow **polls** status while waiting for STK completion; donation totals refresh after successful payment. |

---

## Roles and workflows

### Donor

1. **Register** at `/register` as **Donor** → enter email and password → **email OTP** step → account active and session issued.
2. **Log in** at `/login` → password → **OTP** (same flow for returning users, except the **seeded admin** account, which skips OTP).
3. Browse **Projects** and **Organizations** on the marketing site; open a project.
4. **Donate with Stripe** (signed in as donor): enter amount → Checkout session → complete payment on Stripe’s hosted page → return to **success** (or cancel) URL. Primary payment rail for demos and production-style tests.
5. **M-Pesa** (optional, KES): the donate box can show STK; configuring sandbox keys and a **public HTTPS** callback (e.g. ngrok) is required — see comments in `docker-compose.yml` under the `mpesa` profile.

### NGO user

1. **Register** as **NGO** → complete **OTP** verification.
2. **Sign in** → NGO workspace: complete **organization** details and upload **verification documents** (and profile images: logo, banner, gallery).
3. Wait in **pending review** — cannot publish projects or receive in-app donations until approved.
4. After **admin approval**: create **projects** (draft), set **funding goal**, **dates**, descriptions, upload **project images**, then **publish**.
5. Post **project updates** for transparency; participate in **organization chat**; respond to community activity.

### Platform administrator

- Seeded user (see [Default accounts](#default-accounts)): **no email OTP** on login.
- Review pending NGOs and documents, **approve** or **reject**; monitor donations and reports as needed.

---

## Authentication details (register & login)

- **Register (donor or NGO):** API creates the user, sends a **6-digit OTP** to the email on file, returns a `challengeId`; the UI collects the code and calls **verify** to receive JWT + httpOnly refresh cookie.
- **Login:** Password verified first; then either **OTP email** (same verify endpoint) or immediate tokens for the **seeded admin email** only.
- **SMTP** must be configured for non-admin OTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, etc.). If TLS fails with *self-signed certificate in certificate chain*, you can set `SMTP_TLS_REJECT_UNAUTHORIZED=false` **only in trusted dev environments** (see `backend/README.md`).
- **Cookies:** In Docker, the Next.js app may run with `NODE_ENV=production` while you still open `http://localhost:3000`. Refresh cookies use **`Secure` only when the request is HTTPS** (or when `COOKIE_SECURE=true`), so local HTTP keeps working.

---

## Payments — Stripe (primary)

Use **Stripe test mode** keys in `backend/.env` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). For local development, run Stripe CLI forwarding to your API (see `backend/README.md` and comments in `.env.example`).

**Test card (most common):**

| Field | Value |
|--------|--------|
| Card number | `4242 4242 4242 4242` |
| Expiry | Any **future** month/year (e.g. `12/34`) |
| CVC | Any **3 digits**, e.g. `123` |
| Postal code | If Checkout asks for ZIP/postal, any valid-format value (e.g. `12345`) usually works in test mode |

Other [Stripe test cards](https://docs.stripe.com/testing#cards) cover declines, authentication (3DS), etc.

**M-Pesa:** sandbox-oriented fields exist on the API and donate UI; full STK flow needs consumer key/secret, passkey, shortcode, and a **public** `MPESA_STK_CALLBACK_URL`. Treat as **secondary / in development** relative to Stripe.

---

## Quick start with Docker Compose

### Prerequisites

- Docker and Docker Compose installed.
- Copy **`backend/.env.example`** → **`backend/.env`** and fill at least: `DATABASE_URL` (optional override — Compose sets Postgres for `api`), **JWT** secrets, **MinIO** (defaults often match Compose), **Stripe** test keys and webhook secret, **SMTP** for OTP, `PUBLIC_WEB_URL` (e.g. `http://localhost:3000`), `CORS_ORIGIN` aligned with the web origin.

### First-time build and run

From the **repository root**:

```bash
docker compose build
docker compose up -d
```

- **Postgres** starts on port **5432** (default credentials in Compose match the sample `DATABASE_URL` in `.env.example`).
- **MinIO** is on **9000** (console **9001**); buckets are initialized by `minio-init`.
- **API** runs on **4000** and runs **`prisma migrate deploy`** on startup, then starts Nest.
- **Web** runs on **3000** and uses **`INTERNAL_API_URL=http://api:4000`** to reach the API inside the network.

Open **http://localhost:3000** for the app and **http://localhost:4000** for the API (health/listening as configured).

### Subsequent runs

After images are already built:

```bash
docker compose up -d
```

Rebuild when you change application code or Dockerfiles:

```bash
docker compose build --no-cache
docker compose up -d
```

### Seed admin (first-time database)

With the API able to reach the database (Compose up, or local `DATABASE_URL`):

```bash
cd backend
npx prisma db seed
```

Default seed (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `backend/.env`):

| | |
|--|--|
| Email | `admin@example.com` |
| Password | `Admin123!` |

---

## Environment (summary)

| Location | Purpose |
|----------|---------|
| `backend/.env` | Loaded by the **api** container (`env_file` in Compose). JWT, Stripe, SMTP, M-Pesa, MinIO, `PUBLIC_WEB_URL`, `SEED_ADMIN_*`, optional `SMTP_TLS_REJECT_UNAUTHORIZED`. |
| Root `.env` (optional) | Compose **substitution** only for variables referenced in `docker-compose.yml` (e.g. `MINIO_PUBLIC_ENDPOINT`, `CORS_ORIGIN`). It does **not** replace `backend/.env` for the API unless you wire it yourself. |
| `frontend` | Browser API base: `NEXT_PUBLIC_API_URL`; server BFF in Docker: **`INTERNAL_API_URL=http://api:4000`**. |

See **`.env.example`** at the repo root and **`backend/README.md`** for tables and Stripe/M-Pesa notes.

---

## Project layout

```
backend/     NestJS API, Prisma schema & migrations, Stripe/M-Pesa webhooks
frontend/    Next.js App Router (marketing, auth, donor/ngo/admin dashboards)
docs/        Product story and module outline
docker-compose.yml
```

---

## License

See repository files for license terms if specified; otherwise treat as project-default for your team.
