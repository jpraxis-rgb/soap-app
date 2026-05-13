import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { seedEditalTemplates } from './edital-templates.js';
import { TOPICS } from '../content/disciplines/direito-administrativo/index.js';

async function main() {
  const canonical = TOPICS.map((t) => t.topicName);

  // 1. Push updated templates to DB
  const r = await seedEditalTemplates();
  console.log(`templates: ${JSON.stringify(r)}`);

  // 2. Union-merge canonical topics into each existing Direito Administrativo disciplina.
  //    Preserves any custom topics (append), ensures order matches canonical, dedupes.
  const rows = await db
    .select()
    .from(schema.disciplinas)
    .where(eq(schema.disciplinas.name, 'Direito Administrativo'));

  let updated = 0;
  for (const row of rows) {
    const existing = Array.isArray(row.topics) ? (row.topics as string[]) : [];
    // Canonical first (in order), then any extras the user had that aren't canonical
    const extras = existing.filter((t) => !canonical.includes(t));
    const next = [...canonical, ...extras];
    const changed = existing.length !== next.length || existing.some((t, i) => t !== next[i]);
    if (!changed) continue;
    await db
      .update(schema.disciplinas)
      .set({ topics: next })
      .where(eq(schema.disciplinas.id, row.id));
    updated++;
  }
  console.log(`disciplinas rows updated: ${updated} / ${rows.length}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
