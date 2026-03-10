import { db } from '../db/index.js';
import { concursos } from '../db/schema.js';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Top 50 Brazilian concursos with banca, orgao, and historical topic frequency data.
 * Topic frequency is stored in metadata as a record of topic -> frequency score (1-10).
 */
const SEED_CONCURSOS = [
  {
    name: 'Auditor Fiscal da Receita Federal',
    banca: 'FGV',
    orgao: 'Receita Federal do Brasil',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Tributário': 10, 'Direito Constitucional': 9, 'Direito Administrativo': 9,
        'Contabilidade Geral': 8, 'Legislação Tributária': 8, 'Português': 7,
        'Raciocínio Lógico': 7, 'Direito Previdenciário': 6, 'Comércio Internacional': 5,
      },
    },
  },
  {
    name: 'Analista Judiciário - TRF',
    banca: 'FCC',
    orgao: 'Tribunal Regional Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direito Administrativo': 9, 'Direito Processual Civil': 8,
        'Direito Civil': 7, 'Português': 8, 'Raciocínio Lógico': 6, 'Informática': 5,
      },
    },
  },
  {
    name: 'Técnico Judiciário - TRT',
    banca: 'FCC',
    orgao: 'Tribunal Regional do Trabalho',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito do Trabalho': 10, 'Direito Processual do Trabalho': 9, 'Português': 8,
        'Direito Administrativo': 7, 'Direito Constitucional': 7, 'Informática': 6,
      },
    },
  },
  {
    name: 'Agente de Polícia Federal',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Polícia Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Penal': 10, 'Direito Processual Penal': 9, 'Direito Constitucional': 8,
        'Direito Administrativo': 8, 'Legislação Especial': 7, 'Português': 7,
        'Raciocínio Lógico': 6, 'Informática': 5, 'Contabilidade': 4,
      },
    },
  },
  {
    name: 'Delegado de Polícia Federal',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Polícia Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Penal': 10, 'Direito Processual Penal': 10, 'Direito Constitucional': 9,
        'Direito Administrativo': 8, 'Legislação Especial': 8, 'Português': 7,
      },
    },
  },
  {
    name: 'Analista do INSS',
    banca: 'CESPE/CEBRASPE',
    orgao: 'INSS',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Previdenciário': 10, 'Direito Constitucional': 8, 'Direito Administrativo': 7,
        'Português': 7, 'Raciocínio Lógico': 6, 'Informática': 5,
      },
    },
  },
  {
    name: 'Técnico do INSS',
    banca: 'CESPE/CEBRASPE',
    orgao: 'INSS',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Previdenciário': 10, 'Português': 8, 'Raciocínio Lógico': 7,
        'Informática': 6, 'Ética no Serviço Público': 5, 'Direito Constitucional': 5,
      },
    },
  },
  {
    name: 'Auditor Fiscal do Trabalho',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Ministério do Trabalho',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito do Trabalho': 10, 'Segurança e Saúde no Trabalho': 9,
        'Direito Constitucional': 7, 'Direito Administrativo': 7, 'Português': 6,
      },
    },
  },
  {
    name: 'Procurador da República',
    banca: 'MPF',
    orgao: 'Ministério Público Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direito Penal': 9, 'Direito Processual Penal': 8,
        'Direitos Humanos': 8, 'Direito Administrativo': 7, 'Direito Eleitoral': 5,
      },
    },
  },
  {
    name: 'Promotor de Justiça - MPSP',
    banca: 'MPSP',
    orgao: 'Ministério Público de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direito Penal': 10, 'Direito Civil': 9,
        'Direito Processual Civil': 8, 'Direito Processual Penal': 8,
      },
    },
  },
  {
    name: 'Juiz Federal',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Tribunal Regional Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direito Civil': 9, 'Direito Processual Civil': 9,
        'Direito Penal': 8, 'Direito Tributário': 8, 'Direito Administrativo': 7,
      },
    },
  },
  {
    name: 'Juiz do Trabalho',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Tribunal Regional do Trabalho',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito do Trabalho': 10, 'Direito Processual do Trabalho': 10,
        'Direito Constitucional': 8, 'Direito Civil': 7, 'Direito Previdenciário': 6,
      },
    },
  },
  {
    name: 'Defensor Público Federal',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Defensoria Pública da União',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direitos Humanos': 9, 'Direito Penal': 8,
        'Direito Civil': 8, 'Direito Processual Civil': 7,
      },
    },
  },
  {
    name: 'Analista Judiciário - STF',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Supremo Tribunal Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direito Administrativo': 9, 'Português': 8,
        'Raciocínio Lógico': 6, 'Informática': 5,
      },
    },
  },
  {
    name: 'Analista Judiciário - STJ',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Superior Tribunal de Justiça',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direito Administrativo': 9,
        'Direito Processual Civil': 7, 'Português': 8, 'Raciocínio Lógico': 6,
      },
    },
  },
  {
    name: 'Analista Judiciário - TSE',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Tribunal Superior Eleitoral',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Eleitoral': 10, 'Direito Constitucional': 9, 'Direito Administrativo': 8,
        'Português': 7, 'Informática': 6,
      },
    },
  },
  {
    name: 'Analista do Banco Central',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Banco Central do Brasil',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Economia': 10, 'Finanças': 9, 'Contabilidade': 8, 'Direito Econômico': 7,
        'Português': 6, 'Raciocínio Lógico': 6, 'Estatística': 5,
      },
    },
  },
  {
    name: 'Auditor Federal de Controle Externo - TCU',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Tribunal de Contas da União',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Controle Externo': 10, 'Direito Administrativo': 9, 'Contabilidade': 8,
        'Administração Financeira e Orçamentária': 8, 'Direito Constitucional': 7,
        'Português': 6, 'Auditoria Governamental': 7,
      },
    },
  },
  {
    name: 'Analista de Planejamento e Orçamento',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Ministério do Planejamento',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Administração Financeira e Orçamentária': 10, 'Economia': 9,
        'Direito Administrativo': 7, 'Contabilidade Pública': 7, 'Português': 6,
      },
    },
  },
  {
    name: 'Diplomata - CACD',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Ministério das Relações Exteriores',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Política Internacional': 10, 'Direito Internacional': 9, 'Inglês': 9,
        'Português': 8, 'Economia': 7, 'Geografia': 6, 'História': 6,
      },
    },
  },
  {
    name: 'Auditor Fiscal - SEFAZ/SP',
    banca: 'FCC',
    orgao: 'Secretaria da Fazenda de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Tributário': 10, 'Contabilidade': 9, 'Legislação Tributária Estadual': 9,
        'Direito Constitucional': 7, 'Português': 6, 'Raciocínio Lógico': 5,
      },
    },
  },
  {
    name: 'Auditor Fiscal - SEFAZ/RS',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Secretaria da Fazenda do Rio Grande do Sul',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Tributário': 10, 'Contabilidade': 9, 'Legislação Tributária Estadual': 8,
        'Direito Administrativo': 7, 'Português': 6,
      },
    },
  },
  {
    name: 'Procurador do Estado - PGE/SP',
    banca: 'FCC',
    orgao: 'Procuradoria Geral do Estado de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direito Administrativo': 10, 'Direito Tributário': 8,
        'Direito Civil': 7, 'Direito Processual Civil': 7,
      },
    },
  },
  {
    name: 'Procurador do Município - PGM/SP',
    banca: 'VUNESP',
    orgao: 'Procuradoria Geral do Município de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Administrativo': 10, 'Direito Constitucional': 9, 'Direito Tributário': 8,
        'Direito Civil': 7, 'Direito Urbanístico': 6,
      },
    },
  },
  {
    name: 'Analista Legislativo - Câmara dos Deputados',
    banca: 'FGV',
    orgao: 'Câmara dos Deputados',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Processo Legislativo': 9, 'Regimento Interno': 8,
        'Direito Administrativo': 7, 'Português': 7,
      },
    },
  },
  {
    name: 'Analista Legislativo - Senado Federal',
    banca: 'FGV',
    orgao: 'Senado Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Processo Legislativo': 9, 'Regimento Interno': 8,
        'Administração Pública': 7, 'Português': 7,
      },
    },
  },
  {
    name: 'Analista do MPU',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Ministério Público da União',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direito Administrativo': 9, 'Legislação do MPU': 8,
        'Português': 7, 'Raciocínio Lógico': 6,
      },
    },
  },
  {
    name: 'Agente da Polícia Rodoviária Federal',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Polícia Rodoviária Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Legislação de Trânsito': 10, 'Direito Penal': 8, 'Direito Constitucional': 7,
        'Direito Administrativo': 7, 'Português': 6, 'Física': 4,
      },
    },
  },
  {
    name: 'Escrivão da Polícia Federal',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Polícia Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Penal': 10, 'Direito Processual Penal': 9, 'Direito Constitucional': 8,
        'Direito Administrativo': 7, 'Português': 7, 'Contabilidade': 5,
      },
    },
  },
  {
    name: 'Perito Criminal Federal',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Polícia Federal',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Penal': 8, 'Criminalística': 10, 'Informática Forense': 7,
        'Direito Constitucional': 6, 'Português': 5,
      },
    },
  },
  {
    name: 'Oficial de Justiça - TJ/SP',
    banca: 'VUNESP',
    orgao: 'Tribunal de Justiça de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Processual Civil': 10, 'Direito Civil': 8, 'Direito Constitucional': 7,
        'Português': 7, 'Legislação Especial': 6,
      },
    },
  },
  {
    name: 'Escrevente Técnico Judiciário - TJ/SP',
    banca: 'VUNESP',
    orgao: 'Tribunal de Justiça de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Processual Civil': 9, 'Normas da Corregedoria': 8, 'Direito Penal': 7,
        'Português': 8, 'Raciocínio Lógico': 5, 'Informática': 5,
      },
    },
  },
  {
    name: 'Analista Tributário da Receita Federal',
    banca: 'FGV',
    orgao: 'Receita Federal do Brasil',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Tributário': 10, 'Contabilidade': 8, 'Direito Constitucional': 7,
        'Direito Administrativo': 7, 'Português': 6, 'Raciocínio Lógico': 6,
      },
    },
  },
  {
    name: 'Técnico Administrativo - ANVISA',
    banca: 'CESPE/CEBRASPE',
    orgao: 'ANVISA',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Português': 8, 'Raciocínio Lógico': 7, 'Direito Administrativo': 7,
        'Legislação de Vigilância Sanitária': 9, 'Informática': 5,
      },
    },
  },
  {
    name: 'Especialista em Regulação - ANATEL',
    banca: 'CESPE/CEBRASPE',
    orgao: 'ANATEL',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Telecomunicações': 10, 'Direito Administrativo': 8, 'Regulação': 9,
        'Direito Constitucional': 6, 'Português': 6,
      },
    },
  },
  {
    name: 'Especialista em Regulação - ANEEL',
    banca: 'CESPE/CEBRASPE',
    orgao: 'ANEEL',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Energia Elétrica': 10, 'Regulação': 9, 'Direito Administrativo': 7,
        'Economia': 6, 'Português': 5,
      },
    },
  },
  {
    name: 'Analista do Tesouro Nacional',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Secretaria do Tesouro Nacional',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Administração Financeira e Orçamentária': 10, 'Contabilidade Pública': 9,
        'Economia': 8, 'Direito Financeiro': 7, 'Português': 5,
      },
    },
  },
  {
    name: 'Controlador de Tráfego Aéreo',
    banca: 'CESPE/CEBRASPE',
    orgao: 'DECEA',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Navegação Aérea': 10, 'Meteorologia': 8, 'Inglês Técnico': 9,
        'Regulamentos de Tráfego Aéreo': 9, 'Português': 5,
      },
    },
  },
  {
    name: 'Analista Judiciário - TJ/RJ',
    banca: 'FGV',
    orgao: 'Tribunal de Justiça do Rio de Janeiro',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 9, 'Direito Administrativo': 9, 'Direito Civil': 8,
        'Direito Processual Civil': 8, 'Português': 7,
      },
    },
  },
  {
    name: 'Analista Judiciário - TJ/MG',
    banca: 'CONSULPLAN',
    orgao: 'Tribunal de Justiça de Minas Gerais',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 9, 'Direito Administrativo': 8, 'Direito Civil': 8,
        'Português': 7, 'Informática': 5,
      },
    },
  },
  {
    name: 'Analista de Comércio Exterior - MDIC',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Ministério do Desenvolvimento, Indústria e Comércio',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Comércio Internacional': 10, 'Economia Internacional': 9, 'Direito Aduaneiro': 8,
        'Inglês': 7, 'Português': 6,
      },
    },
  },
  {
    name: 'Auditor Fiscal Municipal - ISS/SP',
    banca: 'FCC',
    orgao: 'Prefeitura de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Tributário': 10, 'Contabilidade': 9, 'Legislação Municipal': 8,
        'Direito Administrativo': 7, 'Português': 6,
      },
    },
  },
  {
    name: 'Defensor Público do Estado - DPE/SP',
    banca: 'FCC',
    orgao: 'Defensoria Pública do Estado de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Constitucional': 10, 'Direitos Humanos': 9, 'Direito Penal': 8,
        'Direito Civil': 8, 'Direito da Criança e Adolescente': 7,
      },
    },
  },
  {
    name: 'Delegado de Polícia Civil - PC/SP',
    banca: 'VUNESP',
    orgao: 'Polícia Civil de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Penal': 10, 'Direito Processual Penal': 10, 'Direito Constitucional': 8,
        'Criminologia': 7, 'Medicina Legal': 6,
      },
    },
  },
  {
    name: 'Investigador de Polícia - PC/SP',
    banca: 'VUNESP',
    orgao: 'Polícia Civil de São Paulo',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Penal': 9, 'Direito Processual Penal': 9, 'Direito Constitucional': 7,
        'Português': 7, 'Raciocínio Lógico': 5,
      },
    },
  },
  {
    name: 'Analista - CGU',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Controladoria-Geral da União',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Auditoria': 10, 'Contabilidade': 9, 'Direito Administrativo': 8,
        'Administração Financeira e Orçamentária': 7, 'Português': 6,
      },
    },
  },
  {
    name: 'Analista do Seguro Social - Serviço Social',
    banca: 'CESPE/CEBRASPE',
    orgao: 'INSS',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Serviço Social': 10, 'Direito Previdenciário': 9, 'Política Social': 8,
        'Direito Constitucional': 6, 'Português': 6,
      },
    },
  },
  {
    name: 'Analista em Tecnologia da Informação - SERPRO',
    banca: 'CESPE/CEBRASPE',
    orgao: 'SERPRO',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Desenvolvimento de Software': 10, 'Banco de Dados': 9, 'Redes': 8,
        'Segurança da Informação': 7, 'Governança de TI': 6,
      },
    },
  },
  {
    name: 'Analista de TI - DATAPREV',
    banca: 'CESPE/CEBRASPE',
    orgao: 'DATAPREV',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Desenvolvimento de Software': 10, 'Banco de Dados': 8, 'Infraestrutura': 7,
        'Segurança da Informação': 7, 'Governança de TI': 6,
      },
    },
  },
  {
    name: 'Analista Judiciário - TRE',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Tribunal Regional Eleitoral',
    year: CURRENT_YEAR,
    metadata: {
      topicFrequency: {
        'Direito Eleitoral': 10, 'Direito Constitucional': 9, 'Direito Administrativo': 8,
        'Português': 7, 'Informática': 5,
      },
    },
  },
];

/**
 * Seed the concursos table with the top 50 Brazilian concursos.
 * Skips insertion if concursos with the same name already exist.
 */
export async function seedConcursos(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const concurso of SEED_CONCURSOS) {
    try {
      await db.insert(concursos).values({
        name: concurso.name,
        banca: concurso.banca,
        orgao: concurso.orgao,
        year: concurso.year,
        isActive: true,
        metadata: concurso.metadata,
      });
      inserted++;
    } catch {
      // Skip duplicates or errors
      skipped++;
    }
  }

  return { inserted, skipped };
}

/**
 * Get the seed data without inserting (useful for testing).
 */
export function getSeedData() {
  return SEED_CONCURSOS;
}
