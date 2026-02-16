DROP TABLE `plans`;--> statement-breakpoint
ALTER TABLE `apps` ADD `profile_learned` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `apps` ADD `profile_source` text;