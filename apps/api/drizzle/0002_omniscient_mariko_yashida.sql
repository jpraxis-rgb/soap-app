CREATE TABLE "edital_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concurso_id" uuid,
	"name" varchar(255) NOT NULL,
	"banca" varchar(100) NOT NULL,
	"orgao" varchar(255) NOT NULL,
	"exam_date" timestamp,
	"disciplinas" jsonb NOT NULL,
	"cargos" jsonb,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "edital_templates" ADD CONSTRAINT "edital_templates_concurso_id_concursos_id_fk" FOREIGN KEY ("concurso_id") REFERENCES "public"."concursos"("id") ON DELETE set null ON UPDATE no action;