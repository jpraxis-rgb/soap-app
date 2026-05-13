import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';

const RENAME: Record<string, string> = {
  'Servidores Públicos': 'Agentes Públicos',
  'Licitações e Contratos': 'Licitação e Contratos Administrativos',
  'Licitações': 'Licitação e Contratos Administrativos',
  'Princípios da Administração': 'Princípios da Administração Pública',
  'Controle da Administração': 'Controle da Administração Pública',
  'Processo Administrativo': 'Controle da Administração Pública',
};

function renameTopics(topics: unknown): string[] | null {
  const list: string[] = Array.isArray(topics)
    ? (topics as string[])
    : (topics && typeof topics === 'object' && 'items' in (topics as Record<string, unknown>))
      ? ((topics as Record<string, unknown>).items as string[])
      : [];
  if (list.length === 0) return null;

  const renamed = Array.from(new Set(list.map((t) => RENAME[t] ?? t)));
  const changed = list.length !== renamed.length || list.some((t, i) => t !== renamed[i]);
  return changed ? renamed : null;
}

async function main() {
  // 1. Rewrite disciplinas.topics for every row with name='Direito Administrativo'
  const rows = await db
    .select()
    .from(schema.disciplinas)
    .where(eq(schema.disciplinas.name, 'Direito Administrativo'));

  let dUpdated = 0;
  for (const row of rows) {
    const next = renameTopics(row.topics);
    if (!next) continue;
    await db
      .update(schema.disciplinas)
      .set({ topics: next })
      .where(eq(schema.disciplinas.id, row.id));
    dUpdated++;
  }
  console.log(`disciplinas rows updated: ${dUpdated} / ${rows.length}`);

  // 2. Rewrite schedule_blocks.topic for blocks in Direito Administrativo disciplinas
  const discIds = rows.map((r) => r.id);
  let sUpdated = 0;
  for (const discId of discIds) {
    const blocks = await db
      .select()
      .from(schema.scheduleBlocks)
      .where(eq(schema.scheduleBlocks.disciplinaId, discId));
    for (const b of blocks) {
      const next = RENAME[b.topic];
      if (!next || next === b.topic) continue;
      await db
        .update(schema.scheduleBlocks)
        .set({ topic: next })
        .where(eq(schema.scheduleBlocks.id, b.id));
      sUpdated++;
    }
  }
  console.log(`schedule_blocks rows updated: ${sUpdated}`);

  // 3. Rewrite study_sessions.topic likewise (so past-session history still resolves)
  let ssUpdated = 0;
  for (const discId of discIds) {
    const sessions = await db
      .select()
      .from(schema.studySessions)
      .where(eq(schema.studySessions.disciplinaId, discId));
    for (const s of sessions) {
      const next = RENAME[s.topic];
      if (!next || next === s.topic) continue;
      await db
        .update(schema.studySessions)
        .set({ topic: next })
        .where(eq(schema.studySessions.id, s.id));
      ssUpdated++;
    }
  }
  console.log(`study_sessions rows updated: ${ssUpdated}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
