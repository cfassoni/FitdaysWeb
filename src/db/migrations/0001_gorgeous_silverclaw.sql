ALTER TABLE `fitdays_records` ADD `starred` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `shared_links` ADD `auto_share_starred` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `shared_links` ADD `manual_entry_ids` text;