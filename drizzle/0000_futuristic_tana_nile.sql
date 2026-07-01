CREATE TYPE "public"."league" AS ENUM('MLB', 'NFL', 'NBA', 'NHL');--> statement-breakpoint
CREATE TYPE "public"."season_status" AS ENUM('not_started', 'active', 'eliminated', 'champion');--> statement-breakpoint
CREATE TABLE "championship_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "championship_events_team_id_year_unique" UNIQUE("team_id","year")
);
--> statement-breakpoint
CREATE TABLE "dinner_debts" (
	"id" serial PRIMARY KEY NOT NULL,
	"championship_event_id" integer NOT NULL,
	"debtor_owner_id" integer NOT NULL,
	"creditor_owner_id" integer NOT NULL,
	"fulfilled" boolean DEFAULT false NOT NULL,
	"fulfilled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "owners_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "team_season_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"year" integer NOT NULL,
	"status" "season_status" DEFAULT 'not_started' NOT NULL,
	"note" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_season_statuses_team_id_year_unique" UNIQUE("team_id","year")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"league" "league" NOT NULL,
	"owner_id" integer NOT NULL,
	"espn_team_id" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "championship_events" ADD CONSTRAINT "championship_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dinner_debts" ADD CONSTRAINT "dinner_debts_championship_event_id_championship_events_id_fk" FOREIGN KEY ("championship_event_id") REFERENCES "public"."championship_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dinner_debts" ADD CONSTRAINT "dinner_debts_debtor_owner_id_owners_id_fk" FOREIGN KEY ("debtor_owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dinner_debts" ADD CONSTRAINT "dinner_debts_creditor_owner_id_owners_id_fk" FOREIGN KEY ("creditor_owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_season_statuses" ADD CONSTRAINT "team_season_statuses_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;