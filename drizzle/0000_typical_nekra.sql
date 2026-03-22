CREATE TABLE "module_calendar_calendars" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text NOT NULL,
	"is_visible" boolean NOT NULL,
	"is_default" boolean NOT NULL,
	"metadata" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_calendar_event_types" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"default_duration" integer NOT NULL,
	"description" text,
	"metadata" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_calendar_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"all_day" boolean NOT NULL,
	"status" text NOT NULL,
	"color" text,
	"location" text,
	"calendar_id" text,
	"event_type_id" text,
	"entity_id" text,
	"entity_type" text,
	"recurrence_rule" text,
	"recurrence_end" timestamp,
	"recurrence_parent_id" text,
	"tags" jsonb,
	"metadata" jsonb,
	"reminders" jsonb,
	"notes" text,
	"is_active" boolean NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
