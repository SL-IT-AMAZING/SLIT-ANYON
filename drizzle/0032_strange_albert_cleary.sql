CREATE TABLE `agent_runs` (
	`run_id` text PRIMARY KEY NOT NULL,
	`root_chat_id` integer NOT NULL,
	`chat_id` integer NOT NULL,
	`parent_run_id` text,
	`agent_name` text NOT NULL,
	`agent_kind` text DEFAULT 'primary' NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`ended_at` integer,
	`abort_reason` text,
	FOREIGN KEY (`root_chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `background_tasks` (
	`task_id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`type` text DEFAULT 'agent' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`payload_json` text,
	`result_json` text,
	`error` text,
	FOREIGN KEY (`run_id`) REFERENCES `agent_runs`(`run_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `todo_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` text NOT NULL,
	`chat_id` integer NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `agent_runs`(`run_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
