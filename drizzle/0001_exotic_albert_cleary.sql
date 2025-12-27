ALTER TABLE `user_profiles` ADD `mote_vitality` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `mote_calmness` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `mote_confidence` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `mote_cleanliness` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `max_mote_level` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `last_reset_at` integer;