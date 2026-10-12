ALTER TABLE `fitdays_records` RENAME TO `recomp_records`;--> statement-breakpoint
ALTER TABLE `fitdays_reports` RENAME TO `recomp_reports`;--> statement-breakpoint
DROP INDEX IF EXISTS `fitdays_reports_record_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `recomp_reports_record_id_unique` ON `recomp_reports` (`record_id`);
