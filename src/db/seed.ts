import { db } from "./index";
import { owners, teams } from "./schema";
import { roster, type League } from "./seed-data";
import { eq } from "drizzle-orm";

async function main() {
  for (const entry of roster) {
    const [owner] = await db
      .insert(owners)
      .values({ name: entry.owner })
      .onConflictDoUpdate({ target: owners.name, set: { name: entry.owner } })
      .returning();

    for (const [league, teamName] of Object.entries(entry.teams) as [
      League,
      string,
    ][]) {
      const existing = await db.query.teams.findFirst({
        where: (t, { and, eq }) => and(eq(t.league, league), eq(t.ownerId, owner.id)),
      });

      if (existing) {
        await db.update(teams).set({ name: teamName }).where(eq(teams.id, existing.id));
      } else {
        await db.insert(teams).values({
          name: teamName,
          league,
          ownerId: owner.id,
        });
      }
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
