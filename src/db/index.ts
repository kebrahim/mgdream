import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Hosted providers (Supabase, Neon, Railway, ...) require SSL and typically
// terminate it with a cert Node's default trust store won't chain-verify.
// Local/self-hosted Postgres has no SSL listener, so skip it there.
const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString ?? "");

const pool = new Pool({
  connectionString,
  ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
