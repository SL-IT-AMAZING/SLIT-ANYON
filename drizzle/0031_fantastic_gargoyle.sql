CREATE TABLE `native_tool_consents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tool_name` text NOT NULL,
	`consent` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `native_tool_consents_tool_name_unique` ON `native_tool_consents` (`tool_name`);