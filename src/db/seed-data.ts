export type League = "MLB" | "NFL" | "NBA" | "NHL";

export type RosterEntry = {
  owner: string;
  teams: Record<League, string>;
};

// The original 2026 draft. Ownership is permanent unless a team is
// disbanded/relocated out of its league (see `active` on the teams table).
export const roster: RosterEntry[] = [
  {
    owner: "Glenn",
    teams: {
      MLB: "Sacramento A's",
      NFL: "Arizona Cardinals",
      NBA: "Utah Jazz",
      NHL: "San Jose Sharks",
    },
  },
  {
    owner: "Josh",
    teams: {
      MLB: "Pittsburgh Pirates",
      NFL: "Carolina Panthers",
      NBA: "Portland Trail Blazers",
      NHL: "Winnipeg Jets",
    },
  },
  {
    owner: "Erik",
    teams: {
      MLB: "Colorado Rockies",
      NFL: "Miami Dolphins",
      NBA: "LA Clippers",
      NHL: "Buffalo Sabres",
    },
  },
  {
    owner: "Kurt",
    teams: {
      MLB: "Chicago White Sox",
      NFL: "Cleveland Browns",
      NBA: "New Orleans Pelicans",
      NHL: "Columbus Blue Jackets",
    },
  },
  {
    owner: "Matt",
    teams: {
      MLB: "LA Angels",
      NFL: "NY Jets",
      NBA: "Charlotte Hornets",
      NHL: "Calgary Flames",
    },
  },
];
