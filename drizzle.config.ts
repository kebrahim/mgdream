import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need a direct (non-pooled) connection. On Supabase, DATABASE_URL
    // is the pgbouncer transaction-pooler URL used by the app at runtime; DIRECT_URL
    // is the plain port-5432 connection, needed here for DDL. They're the same
    // value for a local/non-pooled Postgres, so DIRECT_URL is optional there.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
