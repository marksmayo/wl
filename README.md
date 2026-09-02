# DropIt — Weight Loss Competition

A small Next.js app for running a group weight-loss competition:

- Register with a full name and password
- Log your weight once per day
- See everyone's progress as a % change line chart, plus ranked standings

The competition window is fixed in code (`src/lib/competition.ts`):
**September 4 – December 15**. Rankings are based on each person's % change
from their own first logged weigh-in, so the start date doesn't have to be
exact for everyone.

## Stack

- Next.js 16 (App Router, Server Actions, Proxy for route protection)
- PostgreSQL via Prisma ORM
- Auth: bcrypt password hashing + a signed JWT session cookie (no third-party
  auth provider, no email required — just full name + password)
- Recharts for the chart, GSAP for entrance animations, Three.js for the
  landing page's particle background

## Running locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — any Postgres instance (local, Docker, Neon, Supabase, Vercel Postgres...)
   - `SESSION_SECRET` — output of `openssl rand -base64 32`

3. Create the database schema:

   ```bash
   npx prisma migrate dev
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Deploying to Vercel

1. Push this repo to GitHub (or your git provider of choice).
2. In Vercel, **Add New → Project** and import the repo.
3. Add a Postgres database: in the project's **Storage** tab, add **Vercel
   Postgres** (or connect Neon/Supabase from the Marketplace). This sets a
   `DATABASE_URL` environment variable for you automatically — if it's named
   differently (e.g. `POSTGRES_PRISMA_URL`), copy its value into a
   `DATABASE_URL` env var so Prisma can find it.
4. Add a `SESSION_SECRET` environment variable (Project Settings →
   Environment Variables) — generate one with `openssl rand -base64 32`.
5. Deploy. The build runs `prisma generate && prisma migrate deploy && next build`,
   so the database schema is created automatically on first deploy.

That's it — no other setup needed. Share the URL with your group so everyone
can register and start logging weigh-ins.

## Notes

- Full name doubles as the login identifier (no email/username system) —
  ask participants to use a name that uniquely identifies them.
- Each user picks lbs or kg at signup; the leaderboard compares everyone by
  **percent change**, not raw weight, so mixed units are fine.
- One weigh-in per person per day; re-submitting the same date updates it.
