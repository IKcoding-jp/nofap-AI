CREATE TABLE `habit_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`habit_id` integer NOT NULL,
	`check_date` text NOT NULL,
	`checked_at` integer NOT NULL,
	`source` text DEFAULT 'same_day' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'challenge' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`challenge_started_on` text,
	`challenge_completed_on` text,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`total_checks` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_habit_progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`unlocked_slots` integer DEFAULT 1 NOT NULL,
	`current_challenge_habit_id` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
