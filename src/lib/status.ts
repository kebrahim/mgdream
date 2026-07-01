import { db } from "@/db";
import { championshipEvents, dinnerDebts, teamSeasonStatuses } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type SeasonStatus = "not_started" | "active" | "eliminated" | "champion";

/**
 * Sets a team's status for a season. Champion transitions create the
 * championship event plus one dinner debt per other owner, exactly once
 * (idempotent on repeated syncs).
 */
export async function setTeamStatus(
  teamId: number,
  year: number,
  status: SeasonStatus,
  note?: string,
) {
  const existing = await db.query.teamSeasonStatuses.findFirst({
    where: and(eq(teamSeasonStatuses.teamId, teamId), eq(teamSeasonStatuses.year, year)),
  });

  if (existing) {
    await db
      .update(teamSeasonStatuses)
      .set({ status, note, updatedAt: new Date() })
      .where(eq(teamSeasonStatuses.id, existing.id));
  } else {
    await db.insert(teamSeasonStatuses).values({ teamId, year, status, note });
  }

  if (status === "champion") {
    await recordChampionship(teamId, year);
  }
}

async function recordChampionship(teamId: number, year: number) {
  const alreadyRecorded = await db.query.championshipEvents.findFirst({
    where: and(eq(championshipEvents.teamId, teamId), eq(championshipEvents.year, year)),
  });
  if (alreadyRecorded) return;

  const team = await db.query.teams.findFirst({ where: (t, { eq }) => eq(t.id, teamId) });
  if (!team) return;

  const [event] = await db
    .insert(championshipEvents)
    .values({ teamId, year })
    .returning();

  const allOwners = await db.query.owners.findMany();
  const otherOwners = allOwners.filter((o) => o.id !== team.ownerId);

  if (otherOwners.length > 0) {
    await db.insert(dinnerDebts).values(
      otherOwners.map((debtor) => ({
        championshipEventId: event.id,
        debtorOwnerId: debtor.id,
        creditorOwnerId: team.ownerId,
      })),
    );
  }
}
