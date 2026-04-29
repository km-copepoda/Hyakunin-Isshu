CREATE TYPE "public"."order_mode" AS ENUM('sequential', 'reverse', 'random');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"name" varchar(16) NOT NULL,
	"chapter" integer NOT NULL,
	"order_mode" "order_mode" NOT NULL,
	"time_ms" integer NOT NULL,
	"misses" integer NOT NULL,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scores_ranking_idx" ON "scores" USING btree ("chapter","order_mode","played_at");