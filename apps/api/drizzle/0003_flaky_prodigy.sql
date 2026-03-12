ALTER TABLE "content_items" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "disciplina_name" varchar(255);--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "source" varchar(20) DEFAULT 'ai_curated';--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_template_id_edital_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."edital_templates"("id") ON DELETE cascade ON UPDATE no action;