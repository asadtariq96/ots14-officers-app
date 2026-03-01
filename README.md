# 14th OTS Officers Database

CRUD web app for managing Pakistan Army 14th OTS officer records with Supabase auth, profile pictures, and subscription tracking.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL, Auth, Storage)
- TanStack Table

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Configure Supabase credentials in `.env`.

4. Run locally:

```bash
npm run dev
```

## Supabase

Run SQL migrations in order:

- `supabase/migrations/001_create_officers.sql`
- `supabase/migrations/002_create_subscriptions.sql`
- `supabase/migrations/003_create_profiles.sql`
- `supabase/migrations/004_rls_policies.sql`

## Excel Import

One-time import script:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:excel -- /path/to/officers.xlsx
```

Expected worksheets:

- `Master Database`
- `Deceased`
- `15th OTS Passed Out`
- `Deceased 15 OTS`
- `Subscription`
