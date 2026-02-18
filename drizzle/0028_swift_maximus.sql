ALTER TABLE `apps` DROP COLUMN `neon_project_id`;--> statement-breakpoint
ALTER TABLE `apps` DROP COLUMN `neon_development_branch_id`;--> statement-breakpoint
ALTER TABLE `apps` DROP COLUMN `neon_preview_branch_id`;--> statement-breakpoint
ALTER TABLE `versions` DROP COLUMN `neon_db_timestamp`;