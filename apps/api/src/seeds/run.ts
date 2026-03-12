import 'dotenv/config';
import { seedConcursos } from './concursos';
import { seedEditalTemplates } from './edital-templates';
import { seedContent } from './content-seed';

async function main() {
  console.log('🌱 Running seeds...');

  try {
    const result = await seedConcursos();
    console.log(`✅ Concursos: ${result.inserted} inserted, ${result.skipped} skipped`);

    const templateResult = await seedEditalTemplates();
    console.log(`✅ Edital Templates: ${templateResult.inserted} inserted, ${templateResult.skipped} skipped`);

    const contentResult = await seedContent();
    console.log(`✅ Content: ${contentResult.inserted} inserted, ${contentResult.skipped} skipped`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  console.log('🌱 Seeds completed!');
  process.exit(0);
}

main();
