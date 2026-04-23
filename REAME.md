# Donor funding platform

Stack: **Next.js** (`frontend/`), **NestJS** (`backend/`), **PostgreSQL** (Prisma), **MinIO**, **Stripe** (test).

## Run locally

1. Copy `.env.example` to `.env`; set `DATABASE_URL`, JWT secrets, MinIO, Stripe test keys, `PUBLIC_WEB_URL=http://localhost:3000`.
2. `docker compose up -d` (create `docker-compose.yml` with Postgres 16 + MinIO + `mc` bucket init if missing).
3. `cd backend && npx prisma migrate dev && npx prisma db seed && npm run start:dev`
4. `cd frontend` — add `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000`, `INTERNAL_API_URL=http://localhost:4000` — then `npm run dev`
5. Seed admin: `admin@example.com` / `Admin123!`

Docs: `docs/product-story-and-modules.md`