CREATE TABLE "story_comments" (
	"id" serial PRIMARY KEY,
	"story_slug" text NOT NULL,
	"author" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_hearts" (
	"story_slug" text PRIMARY KEY,
	"heart_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
