import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';

async function main() {
  const items = await db
    .select({
      topic: schema.contentItems.topic,
      format: schema.contentItems.format,
      source: schema.contentItems.source,
      status: schema.contentItems.status,
      templateId: schema.contentItems.templateId,
    })
    .from(schema.contentItems)
    .where(eq(schema.contentItems.disciplinaName, 'Direito Administrativo'));

  console.log(`content_items: ${items.length}`);
  const byTopic = new Map<string, typeof items>();
  for (const it of items) {
    if (!byTopic.has(it.topic)) byTopic.set(it.topic, [] as any);
    (byTopic.get(it.topic) as any).push(it);
  }
  console.log(`distinct topics: ${byTopic.size}`);
  for (const [t, list] of byTopic) {
    const tags = list.map((i) => `${i.format}[${i.source}/${i.status}${i.templateId ? ',tpl' : ''}]`).join(' ');
    console.log(`  ${t}: ${tags}`);
  }

  const discs = await db
    .select()
    .from(schema.disciplinas)
    .where(eq(schema.disciplinas.name, 'Direito Administrativo'));
  console.log(`\ndisciplinas: ${discs.length}`);
  for (const d of discs) {
    const arr = Array.isArray(d.topics) ? (d.topics as string[]) : [];
    console.log(`  ${d.id} editalId=${d.editalId} topics=${arr.length}`);
    for (const t of arr) console.log(`    - ${t}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
