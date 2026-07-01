# Championship Tracker

Tracks 5 owners' drafted MLB/NFL/NBA/NHL teams (20 total) starting with the 2026
season. Whenever a drafted team wins its league's championship, the app
records it and creates a dinner debt from every other owner to the winner.

## Stack

- Next.js (App Router, TypeScript)
- Postgres via [Drizzle ORM](https://orm.drizzle.team) (no native binaries, so it
  installs cleanly behind restrictive proxies — this is why the project uses
  Drizzle instead of Prisma)
- Tailwind CSS
- Season status sync sourced from ESPN's public (unofficial) site API

## Data model

- `owners` — the 5 friends.
- `teams` — the 20 drafted teams, permanently tied to an owner. Has an
  `active` flag for the rare case a team is disbanded/relocated out of its
  league.
- `team_season_statuses` — one row per team per year: `not_started`,
  `active`, `eliminated`, or `champion`.
- `championship_events` — created automatically the first time a team's
  status is set to `champion` for a year.
- `dinner_debts` — created automatically alongside a `championship_event`:
  one row per non-winning owner, each with a `fulfilled` flag.

## Local setup

1. Start Postgres and create a database, then copy `.env.example` to
   `.env.local` and fill in `DATABASE_URL`, `ADMIN_SECRET`, and `SYNC_SECRET`.
2. Install dependencies: `npm install`
3. Run migrations: `npx drizzle-kit migrate`
4. Seed the roster (owners/teams from `src/db/seed-data.ts`): `npm run db:seed`
5. `npm run dev` and open http://localhost:3000

## Pages

- `/` — dashboard grid of all 20 teams by owner/league for a selected year.
- `/history` — championship history and the dinner ledger (who owes whom,
  paid vs. outstanding).
- `/admin` — manually override any team's status for the current year, mark
  dinner debts as paid, or trigger a live ESPN sync. Mutating actions prompt
  for the shared `ADMIN_SECRET` (stored in the browser's `localStorage` after
  first entry) or `SYNC_SECRET` for the sync button.

## ESPN sync

`POST /api/sync?year=2026` (header `x-sync-secret: <SYNC_SECRET>`) pulls each
league's team list, matches it to our roster by name (falls back to
nickname/city matching so a rename or relocation like the A's move to
Sacramento doesn't break the mapping), fetches each team's schedule for that
season, and derives a status:

- No games yet → `not_started`
- Regular season incomplete, or alive in the playoffs → `active`
- Lost their most recent postseason game → `eliminated`
- Won a game recognized as their league's championship (Super Bowl, World
  Series, NBA Finals, Stanley Cup Final) → `champion` (auto-creates the
  dinner debts)

**Caveat:** ESPN's `site.api.espn.com` endpoint is undocumented/unofficial. It
could change shape without notice, and the championship-round text matching
in `src/lib/espn.ts` (`CHAMPIONSHIP_MARKERS`) is a heuristic — verify it
against real playoff data once deployed, since this endpoint was not reachable
from the sandbox this app was originally built in (network egress there is
locked down to an allowlist that didn't include ESPN). The manual override in
`/admin` is there as a safety net if a sync run gets a team's status wrong.

Trigger sync on a schedule with `.github/workflows/sync.yml`, which calls
`/api/sync` on your deployed URL. Set the `APP_URL` and `SYNC_SECRET` repo
secrets for it to work.

## Deploying to Vercel + Supabase

1. **Create the Supabase project** at [supabase.com](https://supabase.com) (free
   tier). In Project Settings → Database → Connection string, grab two URLs:
   - **Transaction pooler** (port `6543`) → this is `DATABASE_URL`. The app
     uses it at runtime; Vercel's serverless functions open many short-lived
     connections, and only the pooler can handle that without exhausting
     Postgres's connection limit.
   - **Direct connection** (port `5432`) → this is `DIRECT_URL`. Migrations
     (`drizzle-kit migrate`) need a direct connection — pgbouncer's
     transaction-pooling mode doesn't support everything DDL needs.
   
   Both URLs should already include `?sslmode=require`; keep it.

2. **Run the migration and seed against Supabase, from your machine**, before
   or right after the first deploy:
   ```bash
   DATABASE_URL="<pooler-url>" DIRECT_URL="<direct-url>" npx drizzle-kit migrate
   DATABASE_URL="<pooler-url>" npm run db:seed
   ```

3. **Deploy to Vercel**: import this repo at [vercel.com/new](https://vercel.com/new)
   (it auto-detects Next.js, no config needed). In the project's
   Settings → Environment Variables, set:
   - `DATABASE_URL` — the Supabase pooler URL
   - `ADMIN_SECRET` — your own shared secret for `/admin` edits
   - `SYNC_SECRET` — your own shared secret for the sync endpoint
   
   (`DIRECT_URL` isn't needed on Vercel — only for running migrations locally.)

4. **Wire up scheduled syncing**: in the GitHub repo's Settings → Secrets and
   variables → Actions, add `APP_URL` (your Vercel deployment URL) and
   `SYNC_SECRET` (same value as in Vercel) so `.github/workflows/sync.yml` can
   call `/api/sync` on a schedule.

Neon is an equally good free alternative to Supabase here — same pooled vs.
direct connection-string split, just from Neon's dashboard instead.
