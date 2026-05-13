import 'dotenv/config';
import { seedConcursos } from './concursos';
import { seedEditalTemplates } from './edital-templates';
import { seedContent } from './content-seed';
import { seedDireitoAdministrativo } from './direito-admin-seed';
import { seedAdministracaoFinanceiraOrcamentaria } from './afo-seed';

async function main() {
  console.log('🌱 Running seeds...');

  try {
    const result = await seedConcursos();
    console.log(`✅ Concursos: ${result.inserted} inserted, ${result.skipped} skipped`);

    const templateResult = await seedEditalTemplates();
    console.log(`✅ Edital Templates: ${templateResult.inserted} inserted, ${templateResult.skipped} skipped`);

    const contentResult = await seedContent();
    console.log(`✅ Content: ${contentResult.inserted} inserted, ${contentResult.skipped} skipped`);

    const direitoAdmResult = await seedDireitoAdministrativo();
    console.log(`✅ Direito Administrativo: ${direitoAdmResult.inserted} items across ${direitoAdmResult.topics} topics`);

    const afoResult = await seedAdministracaoFinanceiraOrcamentaria();
    console.log(`✅ Administração Financeira e Orçamentária: ${afoResult.inserted} items across ${afoResult.topics} topics`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  console.log('🌱 Seeds completed!');
  process.exit(0);
}

main();
