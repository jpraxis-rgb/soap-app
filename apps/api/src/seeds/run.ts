import 'dotenv/config';
import { seedConcursos } from './concursos';

async function main() {
  console.log('🌱 Running seeds...');

  try {
    const result = await seedConcursos();
    console.log(`✅ Concursos: ${result.inserted} inserted, ${result.skipped} skipped`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  console.log('🌱 Seeds completed!');
  process.exit(0);
}

main();
