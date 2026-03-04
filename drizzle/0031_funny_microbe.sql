CREATE TABLE `liked_themes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`theme_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `liked_themes_theme_id_unique` ON `liked_themes` (`theme_id`);