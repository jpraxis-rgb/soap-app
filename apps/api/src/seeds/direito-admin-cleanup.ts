import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';

async function main() {
  const before = await db
    .select({ id: schema.contentItems.id })
    .from(schema.contentItems)
    .where(eq(schema.contentItems.disciplinaName, 'Direito Administrativo'));
  console.log(`before: ${before.length} content_items for Direito Administrativo`);

  const deleted = await db
    .delete(schema.contentItems)
    .where(eq(schema.contentItems.disciplinaName, 'Direito Administrativo'))
    .returning({ id: schema.contentItems.id });
  console.log(`deleted: ${deleted.length}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
