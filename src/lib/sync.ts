import { db } from "@/db";
import { teams } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { League } from "@/db/seed-data";
import {
  determineSeasonStatus,
  fetchLeagueTeams,
  fetchTeamSeasonEvents,
  matchEspnTeam,
} from "@/lib/espn";
import { setTeamStatus } from "@/lib/status";

export type SyncResult = {
  league: League;
  team: string;
  status: string;
  error?: string;
};

export async function syncLeague(league: League, year: number): Promise<SyncResult[]> {
  const ourTeams = await db.query.teams.findMany({
    where: and(eq(teams.league, league), eq(teams.active, true)),
  });

  const espnTeams = await fetchLeagueTeams(league);
  const results: SyncResult[] = [];

  for (const team of ourTeams) {
    try {
      let espnTeamId = team.espnTeamId;

      if (!espnTeamId) {
        const match = matchEspnTeam(team.name, espnTeams);
        if (!match) {
          results.push({
            league,
            team: team.name,
            status: "unmatched",
            error: "Could not match this team to an ESPN team. Set espnTeamId manually.",
          });
          continue;
        }
        espnTeamId = match.id;
        await db.update(teams).set({ espnTeamId }).where(eq(teams.id, team.id));
      }

      const events = await fetchTeamSeasonEvents(league, espnTeamId, year);
      const status = determineSeasonStatus(league, events);
      await setTeamStatus(team.id, year, status);
      results.push({ league, team: team.name, status });
    } catch (err) {
      results.push({
        league,
        team: team.name,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

export async function syncAllLeagues(year: number): Promise<SyncResult[]> {
  const leagues: League[] = ["MLB", "NFL", "NBA", "NHL"];
  const all: SyncResult[] = [];
  for (const league of leagues) {
    all.push(...(await syncLeague(league, year)));
  }
  return all;
}
