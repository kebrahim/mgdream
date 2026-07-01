import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const leagueEnum = pgEnum("league", ["MLB", "NFL", "NBA", "NHL"]);

export const seasonStatusEnum = pgEnum("season_status", [
  "not_started",
  "active",
  "eliminated",
  "champion",
]);

export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  league: leagueEnum("league").notNull(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => owners.id),
  // Cached ESPN team id, resolved lazily on first successful sync match.
  espnTeamId: text("espn_team_id"),
  active: boolean("active").notNull().default(true),
});

export const teamSeasonStatuses = pgTable(
  "team_season_statuses",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    year: integer("year").notNull(),
    status: seasonStatusEnum("status").notNull().default("not_started"),
    note: text("note"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.teamId, t.year)],
);

export const championshipEvents = pgTable(
  "championship_events",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    year: integer("year").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.teamId, t.year)],
);

export const dinnerDebts = pgTable("dinner_debts", {
  id: serial("id").primaryKey(),
  championshipEventId: integer("championship_event_id")
    .notNull()
    .references(() => championshipEvents.id),
  debtorOwnerId: integer("debtor_owner_id")
    .notNull()
    .references(() => owners.id),
  creditorOwnerId: integer("creditor_owner_id")
    .notNull()
    .references(() => owners.id),
  fulfilled: boolean("fulfilled").notNull().default(false),
  fulfilledAt: timestamp("fulfilled_at"),
});
