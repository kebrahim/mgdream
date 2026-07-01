import { db } from "@/db";
import { championshipEvents, dinnerDebts, owners, teams, teamSeasonStatuses } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import type { League } from "@/db/seed-data";

export const LEAGUE_ORDER: League[] = ["MLB", "NFL", "NBA", "NHL"];
export const FIRST_SEASON_YEAR = 2026;

export type TeamWithStatus = {
  id: number;
  name: string;
  league: League;
  ownerId: number;
  ownerName: string;
  status: "not_started" | "active" | "eliminated" | "champion";
  note: string | null;
};

export async function getRosterForYear(year: number): Promise<TeamWithStatus[]> {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      league: teams.league,
      ownerId: teams.ownerId,
      ownerName: owners.name,
      status: teamSeasonStatuses.status,
      note: teamSeasonStatuses.note,
    })
    .from(teams)
    .innerJoin(owners, eq(teams.ownerId, owners.id))
    .leftJoin(
      teamSeasonStatuses,
      and(eq(teamSeasonStatuses.teamId, teams.id), eq(teamSeasonStatuses.year, year)),
    )
    .where(eq(teams.active, true));

  return rows.map((r) => ({ ...r, status: r.status ?? "not_started" })) as TeamWithStatus[];
}

export async function getAllOwners() {
  return db.query.owners.findMany({ orderBy: (o, { asc }) => asc(o.name) });
}

export async function getChampionshipHistory() {
  return db
    .select({
      year: championshipEvents.year,
      teamName: teams.name,
      league: teams.league,
      ownerName: owners.name,
      createdAt: championshipEvents.createdAt,
    })
    .from(championshipEvents)
    .innerJoin(teams, eq(championshipEvents.teamId, teams.id))
    .innerJoin(owners, eq(teams.ownerId, owners.id))
    .orderBy(desc(championshipEvents.year));
}

export async function getDinnerLedger() {
  const debts = await db
    .select({
      id: dinnerDebts.id,
      fulfilled: dinnerDebts.fulfilled,
      fulfilledAt: dinnerDebts.fulfilledAt,
      year: championshipEvents.year,
      teamName: teams.name,
      league: teams.league,
      debtorId: dinnerDebts.debtorOwnerId,
      creditorId: dinnerDebts.creditorOwnerId,
    })
    .from(dinnerDebts)
    .innerJoin(championshipEvents, eq(dinnerDebts.championshipEventId, championshipEvents.id))
    .innerJoin(teams, eq(championshipEvents.teamId, teams.id))
    .orderBy(desc(championshipEvents.year));

  const ownerList = await getAllOwners();
  const ownerNameById = new Map(ownerList.map((o) => [o.id, o.name]));

  return debts.map((d) => ({
    ...d,
    debtorName: ownerNameById.get(d.debtorId) ?? "Unknown",
    creditorName: ownerNameById.get(d.creditorId) ?? "Unknown",
  }));
}
