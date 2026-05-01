DO $$ BEGIN
	CREATE TYPE "public"."game_mode" AS ENUM('segments', 'author');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DROP INDEX IF EXISTS "scores_ranking_idx";--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN IF NOT EXISTS "game_mode" "game_mode" DEFAULT 'segments' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scores_ranking_idx" ON "scores" USING btree ("chapter","game_mode","order_mode","played_at");