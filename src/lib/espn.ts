import type { League } from "@/db/seed-data";

const SPORT_PATH: Record<League, string> = {
  MLB: "baseball/mlb",
  NFL: "football/nfl",
  NBA: "basketball/nba",
  NHL: "hockey/nhl",
};

// The final round each league uses to crown its champion. ESPN labels the
// championship-round game/series with one of these strings in most seasons.
const CHAMPIONSHIP_MARKERS: Record<League, string[]> = {
  MLB: ["world series"],
  NFL: ["super bowl"],
  NBA: ["nba finals", "finals"],
  NHL: ["stanley cup final", "stanley cup"],
};

const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports";

export type EspnTeamSummary = {
  id: string;
  name: string;
  location: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
};

export type EspnEvent = {
  id: string;
  date: string;
  seasonType: number; // 1 = pre, 2 = regular, 3 = postseason
  name: string;
  notes: string[];
  completed: boolean;
  didTeamWin: boolean | null; // null if not completed yet
};

type RawTeamsResponse = {
  sports?: Array<{
    leagues?: Array<{
      teams?: Array<{
        team: {
          id: string | number;
          name: string;
          location: string;
          displayName: string;
          shortDisplayName: string;
          abbreviation: string;
        };
      }>;
    }>;
  }>;
};

type RawCompetitor = {
  team?: { id: string | number };
  winner?: boolean;
};

type RawCompetition = {
  status?: { type?: { completed?: boolean } };
  competitors?: RawCompetitor[];
  notes?: Array<{ headline?: string }>;
  type?: { id?: string | number };
};

type RawEvent = {
  id: string | number;
  date: string;
  name?: string;
  seasonType?: { type?: string | number };
  competitions?: RawCompetition[];
};

type RawScheduleResponse = {
  events?: RawEvent[];
};

async function espnFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    // ESPN's endpoint is unofficial; never let a slow/hanging response stall a sync.
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`ESPN request failed (${res.status}): ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchLeagueTeams(league: League): Promise<EspnTeamSummary[]> {
  const data = await espnFetch<RawTeamsResponse>(`/${SPORT_PATH[league]}/teams?limit=100`);
  const entries = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return entries.map((e) => ({
    id: String(e.team.id),
    name: e.team.name,
    location: e.team.location,
    displayName: e.team.displayName,
    shortDisplayName: e.team.shortDisplayName,
    abbreviation: e.team.abbreviation,
  }));
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Matches our roster's team name against ESPN's team list. Tries an exact
 * displayName match first, then falls back to substring matching on the
 * team's nickname alone (so e.g. "Sacramento A's" still matches ESPN's
 * "Athletics" after a relocation/rebrand changes the city name).
 */
export function matchEspnTeam(
  rosterName: string,
  espnTeams: EspnTeamSummary[],
): EspnTeamSummary | undefined {
  const normalizedRoster = normalize(rosterName);

  const exact = espnTeams.find((t) => normalize(t.displayName) === normalizedRoster);
  if (exact) return exact;

  const nicknameMatch = espnTeams.find((t) => {
    const nickname = normalize(t.name);
    return nickname.length > 2 && normalizedRoster.endsWith(nickname);
  });
  if (nicknameMatch) return nicknameMatch;

  return espnTeams.find(
    (t) =>
      normalizedRoster.includes(normalize(t.location)) ||
      normalize(t.location).includes(normalizedRoster),
  );
}

export async function fetchTeamSeasonEvents(
  league: League,
  espnTeamId: string,
  year: number,
): Promise<EspnEvent[]> {
  const data = await espnFetch<RawScheduleResponse>(
    `/${SPORT_PATH[league]}/teams/${espnTeamId}/schedule?season=${year}`,
  );
  const events = data.events ?? [];

  return events.map((e) => {
    const competition = e.competitions?.[0];
    const competitor = competition?.competitors?.find(
      (c) => String(c.team?.id) === String(espnTeamId),
    );
    const completed = Boolean(competition?.status?.type?.completed);
    return {
      id: String(e.id),
      date: e.date,
      seasonType: Number(e.seasonType?.type ?? competition?.type?.id ?? 2),
      name: e.name ?? "",
      notes: (competition?.notes ?? []).map((n) => n.headline ?? ""),
      completed,
      didTeamWin: completed ? Boolean(competitor?.winner) : null,
    };
  });
}

function isChampionshipEvent(league: League, event: EspnEvent): boolean {
  const haystack = `${event.name} ${event.notes.join(" ")}`.toLowerCase();
  return CHAMPIONSHIP_MARKERS[league].some((marker) => haystack.includes(marker));
}

/**
 * Derives a team's season status from its schedule.
 *
 * Heuristic: look at postseason (seasonType 3) games only.
 *  - No postseason games at all, and the regular season is over -> eliminated
 *    (didn't make the playoffs).
 *  - No postseason games yet, and the regular season isn't over -> active.
 *  - Most recent postseason game was a loss -> eliminated.
 *  - Most recent postseason game was a win in a recognized championship game
 *    -> champion.
 *  - Most recent postseason game was any other win -> still alive -> active.
 */
export function determineSeasonStatus(
  league: League,
  events: EspnEvent[],
): "not_started" | "active" | "eliminated" | "champion" {
  const regularSeason = events.filter((e) => e.seasonType === 2);
  const postseason = events
    .filter((e) => e.seasonType === 3)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (regularSeason.length === 0 && postseason.length === 0) {
    return "not_started";
  }

  if (postseason.length === 0) {
    const regularSeasonOver =
      regularSeason.length > 0 && regularSeason.every((e) => e.completed);
    return regularSeasonOver ? "eliminated" : "active";
  }

  const completedPostseason = postseason.filter((e) => e.completed);
  if (completedPostseason.length === 0) return "active";

  const lastGame = completedPostseason[completedPostseason.length - 1];
  if (!lastGame.didTeamWin) return "eliminated";
  if (isChampionshipEvent(league, lastGame)) return "champion";
  return "active";
}
