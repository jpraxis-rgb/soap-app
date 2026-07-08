CREATE INDEX "content_items_status_idx" ON "content_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "schedule_blocks_user_date_idx" ON "schedule_blocks" USING btree ("user_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "study_sessions_user_disciplina_idx" ON "study_sessions" USING btree ("user_id","disciplina_id");