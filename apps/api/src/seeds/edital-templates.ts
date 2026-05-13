import { db } from '../db/index.js';
import { editalTemplates } from '../db/schema.js';
import { eq } from 'drizzle-orm';

interface TemplateDisciplina {
  name: string;
  weight: number | null;
  topics: string[];
  category: 'geral' | 'especifico';
  orderIndex: number;
}

interface TemplateCargo {
  name: string;
  disciplinas: TemplateDisciplina[];
}

interface SeedTemplate {
  name: string;
  banca: string;
  orgao: string;
  cargo: string;
  examDate: string | null;
  vagas: number | null;
  nivel: 'superior' | 'medio' | 'fundamental';
  sourceUrl: string | null;
  disciplinas: TemplateDisciplina[];
  cargos: TemplateCargo[] | null;
  sortOrder: number;
}

const SEED_TEMPLATES: SeedTemplate[] = [
  {
    name: 'Auditor Fiscal da Receita Federal',
    banca: 'FGV',
    orgao: 'Receita Federal do Brasil',
    cargo: 'Auditor Fiscal',
    examDate: null,
    vagas: 699,
    nivel: 'superior',
    sourceUrl: null,
    sortOrder: 1,
    cargos: null,
    disciplinas: [
      { name: 'Direito Tributário', weight: null, category: 'especifico', orderIndex: 0, topics: ['Sistema Tributário Nacional', 'Competência Tributária', 'Imunidades e Isenções', 'Obrigação Tributária', 'Crédito Tributário', 'Impostos Federais', 'Contribuições Especiais', 'Processo Administrativo Fiscal'] },
      { name: 'Direito Constitucional', weight: null, category: 'geral', orderIndex: 1, topics: ['Princípios Fundamentais', 'Direitos e Garantias Fundamentais', 'Organização do Estado', 'Organização dos Poderes', 'Sistema Tributário Nacional', 'Controle de Constitucionalidade'] },
      { name: 'Direito Administrativo', weight: null, category: 'geral', orderIndex: 2, topics: ['Estado, Governo e Administração Pública', 'Princípios da Administração Pública', 'Organização da Administração Pública', 'Poderes Administrativos', 'Atos Administrativos', 'Licitação e Contratos Administrativos', 'Serviços Públicos', 'Bens Públicos', 'Agentes Públicos', 'Responsabilidade Civil do Estado', 'Controle da Administração Pública', 'Improbidade Administrativa', 'Intervenção do Estado na Propriedade'] },
      { name: 'Contabilidade Geral', weight: null, category: 'especifico', orderIndex: 3, topics: ['Patrimônio e Variações', 'Demonstrações Contábeis', 'Operações com Mercadorias', 'Ativo Imobilizado', 'Provisões e Contingências'] },
      { name: 'Legislação Tributária', weight: null, category: 'especifico', orderIndex: 4, topics: ['Código Tributário Nacional', 'Legislação do IPI', 'Legislação do IR', 'Legislação Aduaneira'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 5, topics: ['Interpretação de Texto', 'Gramática', 'Concordância Verbal e Nominal', 'Regência', 'Pontuação'] },
      { name: 'Raciocínio Lógico', weight: null, category: 'geral', orderIndex: 6, topics: ['Proposições e Conectivos', 'Equivalências Lógicas', 'Argumentação', 'Análise Combinatória', 'Probabilidade'] },
      { name: 'Direito Previdenciário', weight: null, category: 'especifico', orderIndex: 7, topics: ['Seguridade Social', 'Regime Geral de Previdência', 'Custeio da Previdência', 'Benefícios Previdenciários'] },
      { name: 'Comércio Internacional', weight: null, category: 'especifico', orderIndex: 8, topics: ['Políticas Comerciais', 'Câmbio', 'Regimes Aduaneiros', 'Classificação de Mercadorias', 'Valoração Aduaneira'] },
    ],
  },
  {
    name: 'Agente de Polícia Federal',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Polícia Federal',
    cargo: 'Agente de Polícia Federal',
    examDate: '2025-07-27',
    vagas: 630,
    nivel: 'superior',
    sourceUrl: 'https://cdn.cebraspe.org.br/concursos/pf_25/arquivos/Ed_1_PF_25_Abertura.pdf',
    sortOrder: 2,
    cargos: null,
    disciplinas: [
      { name: 'Direito Penal', weight: null, category: 'especifico', orderIndex: 0, topics: ['Princípios do Direito Penal', 'Teoria do Crime', 'Excludentes de Ilicitude', 'Crimes contra a Pessoa', 'Crimes contra o Patrimônio', 'Crimes contra a Administração Pública', 'Legislação Penal Especial'] },
      { name: 'Direito Processual Penal', weight: null, category: 'especifico', orderIndex: 1, topics: ['Inquérito Policial', 'Ação Penal', 'Prisão e Liberdade Provisória', 'Provas', 'Procedimentos', 'Recursos'] },
      { name: 'Direito Constitucional', weight: null, category: 'geral', orderIndex: 2, topics: ['Direitos e Garantias Fundamentais', 'Organização do Estado', 'Segurança Pública', 'Remédios Constitucionais', 'Nacionalidade'] },
      { name: 'Direito Administrativo', weight: null, category: 'geral', orderIndex: 3, topics: ['Estado, Governo e Administração Pública', 'Princípios da Administração Pública', 'Organização da Administração Pública', 'Poderes Administrativos', 'Atos Administrativos', 'Licitação e Contratos Administrativos', 'Serviços Públicos', 'Bens Públicos', 'Agentes Públicos', 'Responsabilidade Civil do Estado', 'Controle da Administração Pública', 'Improbidade Administrativa', 'Intervenção do Estado na Propriedade'] },
      { name: 'Legislação Especial', weight: null, category: 'especifico', orderIndex: 4, topics: ['Lei de Drogas', 'Estatuto do Desarmamento', 'Crime Organizado', 'Lei de Tortura', 'Crimes Hediondos'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 5, topics: ['Interpretação de Texto', 'Redação Oficial', 'Gramática', 'Concordância e Regência'] },
      { name: 'Raciocínio Lógico', weight: null, category: 'geral', orderIndex: 6, topics: ['Lógica Proposicional', 'Raciocínio Dedutivo', 'Análise Combinatória'] },
      { name: 'Informática', weight: null, category: 'geral', orderIndex: 7, topics: ['Segurança da Informação', 'Redes de Computadores', 'Sistemas Operacionais'] },
      { name: 'Contabilidade', weight: null, category: 'especifico', orderIndex: 8, topics: ['Contabilidade Geral', 'Análise de Balanços', 'Contabilidade de Custos'] },
    ],
  },
  {
    name: 'Técnico do INSS',
    banca: 'CESPE/CEBRASPE',
    orgao: 'INSS',
    cargo: 'Técnico do Seguro Social',
    examDate: null,
    vagas: 6000,
    nivel: 'medio',
    sourceUrl: null,
    sortOrder: 3,
    cargos: null,
    disciplinas: [
      { name: 'Direito Previdenciário', weight: null, category: 'especifico', orderIndex: 0, topics: ['Seguridade Social na CF', 'Regime Geral de Previdência Social', 'Benefícios Previdenciários', 'Custeio da Previdência', 'Salário de Contribuição', 'Decadência e Prescrição'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 1, topics: ['Interpretação de Texto', 'Gramática', 'Concordância', 'Regência', 'Pontuação'] },
      { name: 'Raciocínio Lógico', weight: null, category: 'geral', orderIndex: 2, topics: ['Proposições Lógicas', 'Tabelas-Verdade', 'Equivalências', 'Raciocínio Sequencial'] },
      { name: 'Informática', weight: null, category: 'geral', orderIndex: 3, topics: ['Windows', 'Pacote Office', 'Internet e Navegadores', 'Segurança da Informação'] },
      { name: 'Ética no Serviço Público', weight: null, category: 'geral', orderIndex: 4, topics: ['Código de Ética do Servidor', 'Lei 8.112/90', 'Regime Disciplinar', 'Deveres e Proibições'] },
      { name: 'Direito Constitucional', weight: null, category: 'geral', orderIndex: 5, topics: ['Direitos Sociais', 'Seguridade Social', 'Ordem Social', 'Princípios Fundamentais'] },
      { name: 'Direito Administrativo', weight: null, category: 'geral', orderIndex: 6, topics: ['Estado, Governo e Administração Pública', 'Princípios da Administração Pública', 'Organização da Administração Pública', 'Poderes Administrativos', 'Atos Administrativos', 'Licitação e Contratos Administrativos', 'Serviços Públicos', 'Bens Públicos', 'Agentes Públicos', 'Responsabilidade Civil do Estado', 'Controle da Administração Pública', 'Improbidade Administrativa', 'Intervenção do Estado na Propriedade'] },
      { name: 'Legislação do INSS', weight: null, category: 'especifico', orderIndex: 7, topics: ['Lei 8.213/91', 'Decreto 3.048/99', 'IN INSS/PRES', 'Processo Administrativo Previdenciário'] },
    ],
  },
  {
    name: 'Analista Judiciário - TRF 4ª Região',
    banca: 'FCC',
    orgao: 'TRF 4ª Região',
    cargo: '',
    examDate: '2025-07-13',
    vagas: 30,
    nivel: 'superior',
    sourceUrl: 'https://www.concursosfcc.com.br/concursos/trf4r124/index.html',
    sortOrder: 4,
    cargos: [
      {
        name: 'Área Judiciária',
        disciplinas: [
          { name: 'Direito Processual Civil', weight: null, category: 'especifico', orderIndex: 0, topics: ['Processo de Conhecimento', 'Recursos', 'Execução', 'Procedimentos Especiais', 'Tutelas Provisórias'] },
          { name: 'Direito Civil', weight: null, category: 'especifico', orderIndex: 1, topics: ['Parte Geral', 'Obrigações', 'Contratos', 'Responsabilidade Civil', 'Direitos Reais'] },
          { name: 'Direito Penal', weight: null, category: 'especifico', orderIndex: 2, topics: ['Crimes contra a Administração Pública', 'Teoria do Crime', 'Aplicação da Pena'] },
        ],
      },
      {
        name: 'Área Administrativa',
        disciplinas: [
          { name: 'Administração Pública', weight: null, category: 'especifico', orderIndex: 0, topics: ['Gestão de Pessoas', 'Gestão de Processos', 'Planejamento Estratégico', 'Governança'] },
          { name: 'Administração Financeira e Orçamentária', weight: null, category: 'especifico', orderIndex: 1, topics: ['Estado, Governo e Atividade Financeira do Estado', 'Orçamento Público — Teoria e Fundamentos', 'Sistema Orçamentário Brasileiro — PPA, LDO e LOA', 'Classificações Orçamentárias', 'Receita Pública', 'Despesa Pública', 'Lei de Responsabilidade Fiscal — LRF', 'Execução Orçamentária e Financeira', 'Dívida Pública', 'Resultado Fiscal e Metas', 'Transparência e Instrumentos de Acompanhamento Fiscal', 'Controle das Finanças Públicas'] },
        ],
      },
    ],
    disciplinas: [
      { name: 'Direito Constitucional', weight: null, category: 'geral', orderIndex: 0, topics: ['Princípios Fundamentais', 'Direitos e Garantias Fundamentais', 'Organização do Estado', 'Poder Judiciário', 'Funções Essenciais à Justiça', 'Controle de Constitucionalidade'] },
      { name: 'Direito Administrativo', weight: null, category: 'geral', orderIndex: 1, topics: ['Estado, Governo e Administração Pública', 'Princípios da Administração Pública', 'Organização da Administração Pública', 'Poderes Administrativos', 'Atos Administrativos', 'Licitação e Contratos Administrativos', 'Serviços Públicos', 'Bens Públicos', 'Agentes Públicos', 'Responsabilidade Civil do Estado', 'Controle da Administração Pública', 'Improbidade Administrativa', 'Intervenção do Estado na Propriedade'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 2, topics: ['Interpretação de Texto', 'Gramática', 'Redação Oficial', 'Concordância e Regência'] },
      { name: 'Raciocínio Lógico', weight: null, category: 'geral', orderIndex: 3, topics: ['Lógica Proposicional', 'Raciocínio Analítico', 'Análise Combinatória'] },
      { name: 'Informática', weight: null, category: 'geral', orderIndex: 4, topics: ['Pacote Office', 'Internet', 'Segurança da Informação'] },
    ],
  },
  {
    name: 'Auditor Federal de Controle Externo - TCU',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Tribunal de Contas da União',
    cargo: 'Auditor Federal de Controle Externo',
    examDate: '2026-02-22',
    vagas: 20,
    nivel: 'superior',
    sourceUrl: 'https://www.cebraspe.org.br/concursos/tcu_25_aufc',
    sortOrder: 5,
    cargos: null,
    disciplinas: [
      { name: 'Controle Externo', weight: null, category: 'especifico', orderIndex: 0, topics: ['Controle Externo na CF', 'Lei Orgânica do TCU', 'Regimento Interno do TCU', 'Fiscalização Contábil e Financeira', 'Processos no TCU'] },
      { name: 'Direito Administrativo', weight: null, category: 'geral', orderIndex: 1, topics: ['Estado, Governo e Administração Pública', 'Princípios da Administração Pública', 'Organização da Administração Pública', 'Poderes Administrativos', 'Atos Administrativos', 'Licitação e Contratos Administrativos', 'Serviços Públicos', 'Bens Públicos', 'Agentes Públicos', 'Responsabilidade Civil do Estado', 'Controle da Administração Pública', 'Improbidade Administrativa', 'Intervenção do Estado na Propriedade'] },
      { name: 'Contabilidade Pública', weight: null, category: 'especifico', orderIndex: 2, topics: ['Contabilidade Aplicada ao Setor Público', 'Demonstrações Contábeis', 'Plano de Contas', 'Variações Patrimoniais'] },
      { name: 'Administração Financeira e Orçamentária', weight: null, category: 'especifico', orderIndex: 3, topics: ['Estado, Governo e Atividade Financeira do Estado', 'Orçamento Público — Teoria e Fundamentos', 'Sistema Orçamentário Brasileiro — PPA, LDO e LOA', 'Classificações Orçamentárias', 'Receita Pública', 'Despesa Pública', 'Lei de Responsabilidade Fiscal — LRF', 'Execução Orçamentária e Financeira', 'Dívida Pública', 'Resultado Fiscal e Metas', 'Transparência e Instrumentos de Acompanhamento Fiscal', 'Controle das Finanças Públicas'] },
      { name: 'Auditoria Governamental', weight: null, category: 'especifico', orderIndex: 4, topics: ['Normas de Auditoria', 'Tipos de Auditoria', 'Planejamento de Auditoria', 'Evidências e Achados'] },
      { name: 'Direito Constitucional', weight: null, category: 'geral', orderIndex: 5, topics: ['Organização do Estado', 'Poder Legislativo', 'Fiscalização Contábil e Financeira', 'Tribunal de Contas da União'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 6, topics: ['Interpretação de Texto', 'Gramática', 'Redação Oficial'] },
      { name: 'Economia', weight: null, category: 'especifico', orderIndex: 7, topics: ['Microeconomia', 'Macroeconomia', 'Economia do Setor Público'] },
    ],
  },
  {
    name: 'Analista do BACEN',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Banco Central do Brasil',
    cargo: 'Analista',
    examDate: null,
    vagas: 100,
    nivel: 'superior',
    sourceUrl: null,
    sortOrder: 6,
    cargos: null,
    disciplinas: [
      { name: 'Economia', weight: null, category: 'especifico', orderIndex: 0, topics: ['Microeconomia', 'Macroeconomia', 'Economia Monetária', 'Política Fiscal', 'Economia Internacional', 'Sistema Financeiro Nacional'] },
      { name: 'Finanças', weight: null, category: 'especifico', orderIndex: 1, topics: ['Mercado Financeiro', 'Derivativos', 'Risco e Retorno', 'Avaliação de Ativos', 'Estrutura a Termo da Taxa de Juros'] },
      { name: 'Contabilidade', weight: null, category: 'especifico', orderIndex: 2, topics: ['Contabilidade Geral', 'Demonstrações Contábeis', 'Contabilidade Bancária', 'COSIF'] },
      { name: 'Direito Econômico', weight: null, category: 'especifico', orderIndex: 3, topics: ['Lei do Banco Central', 'Sistema Financeiro Nacional', 'Regulação Financeira', 'Direito da Concorrência'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 4, topics: ['Interpretação de Texto', 'Gramática', 'Redação Oficial'] },
      { name: 'Raciocínio Lógico', weight: null, category: 'geral', orderIndex: 5, topics: ['Lógica Proposicional', 'Análise Combinatória', 'Probabilidade'] },
      { name: 'Estatística', weight: null, category: 'especifico', orderIndex: 6, topics: ['Estatística Descritiva', 'Probabilidade', 'Inferência Estatística', 'Regressão'] },
    ],
  },
  {
    name: 'Técnico Judiciário - TRT 2ª Região',
    banca: 'FCC',
    orgao: 'TRT 2ª Região',
    cargo: 'Técnico Judiciário',
    examDate: '2025-08-03',
    vagas: 7,
    nivel: 'medio',
    sourceUrl: 'https://www.concursosfcc.com.br/concursos/trt2r124/',
    sortOrder: 7,
    cargos: null,
    disciplinas: [
      { name: 'Direito do Trabalho', weight: null, category: 'especifico', orderIndex: 0, topics: ['Princípios do Direito do Trabalho', 'Contrato de Trabalho', 'Jornada de Trabalho', 'Remuneração e Salário', 'Férias', 'Rescisão Contratual', 'Direito Coletivo'] },
      { name: 'Direito Processual do Trabalho', weight: null, category: 'especifico', orderIndex: 1, topics: ['Organização da Justiça do Trabalho', 'Ação Trabalhista', 'Audiência', 'Provas', 'Recursos', 'Execução Trabalhista'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 2, topics: ['Interpretação de Texto', 'Gramática', 'Concordância e Regência', 'Pontuação'] },
      { name: 'Direito Administrativo', weight: null, category: 'geral', orderIndex: 3, topics: ['Estado, Governo e Administração Pública', 'Princípios da Administração Pública', 'Organização da Administração Pública', 'Poderes Administrativos', 'Atos Administrativos', 'Licitação e Contratos Administrativos', 'Serviços Públicos', 'Bens Públicos', 'Agentes Públicos', 'Responsabilidade Civil do Estado', 'Controle da Administração Pública', 'Improbidade Administrativa', 'Intervenção do Estado na Propriedade'] },
      { name: 'Direito Constitucional', weight: null, category: 'geral', orderIndex: 4, topics: ['Direitos Sociais', 'Poder Judiciário', 'Direitos e Garantias Fundamentais'] },
      { name: 'Informática', weight: null, category: 'geral', orderIndex: 5, topics: ['Pacote Office', 'Internet', 'Segurança da Informação'] },
    ],
  },
  {
    name: 'Técnico Federal de Controle Externo - TCU',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Tribunal de Contas da União',
    cargo: 'Técnico Federal de Controle Externo',
    examDate: '2025-08-03',
    vagas: 40,
    nivel: 'medio',
    sourceUrl: 'https://www.cebraspe.org.br/concursos/tcu_25_tefc',
    sortOrder: 8,
    cargos: null,
    disciplinas: [
      { name: 'Controle Externo', weight: null, category: 'especifico', orderIndex: 0, topics: ['Controle Externo na CF', 'Lei Orgânica do TCU', 'Regimento Interno do TCU', 'Tipos de Fiscalização', 'Processos no TCU'] },
      { name: 'Administração Pública', weight: null, category: 'especifico', orderIndex: 1, topics: ['Gestão de Pessoas', 'Gestão de Processos', 'Planejamento Estratégico', 'Governança Pública'] },
      { name: 'Administração Financeira e Orçamentária', weight: null, category: 'especifico', orderIndex: 2, topics: ['Estado, Governo e Atividade Financeira do Estado', 'Orçamento Público — Teoria e Fundamentos', 'Sistema Orçamentário Brasileiro — PPA, LDO e LOA', 'Classificações Orçamentárias', 'Receita Pública', 'Despesa Pública', 'Lei de Responsabilidade Fiscal — LRF', 'Execução Orçamentária e Financeira', 'Dívida Pública', 'Resultado Fiscal e Metas', 'Transparência e Instrumentos de Acompanhamento Fiscal', 'Controle das Finanças Públicas'] },
      { name: 'Direito Constitucional', weight: null, category: 'geral', orderIndex: 3, topics: ['Organização do Estado', 'Poder Legislativo', 'Fiscalização Contábil e Financeira', 'Direitos e Garantias Fundamentais'] },
      { name: 'Direito Administrativo', weight: null, category: 'geral', orderIndex: 4, topics: ['Estado, Governo e Administração Pública', 'Princípios da Administração Pública', 'Organização da Administração Pública', 'Poderes Administrativos', 'Atos Administrativos', 'Licitação e Contratos Administrativos', 'Serviços Públicos', 'Bens Públicos', 'Agentes Públicos', 'Responsabilidade Civil do Estado', 'Controle da Administração Pública', 'Improbidade Administrativa', 'Intervenção do Estado na Propriedade'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 5, topics: ['Interpretação de Texto', 'Gramática', 'Redação Oficial'] },
      { name: 'Raciocínio Lógico', weight: null, category: 'geral', orderIndex: 6, topics: ['Lógica Proposicional', 'Raciocínio Analítico', 'Análise Combinatória'] },
      { name: 'Informática', weight: null, category: 'geral', orderIndex: 7, topics: ['Pacote Office', 'Internet', 'Segurança da Informação'] },
    ],
  },
  {
    name: 'Escrivão da Polícia Federal',
    banca: 'CESPE/CEBRASPE',
    orgao: 'Polícia Federal',
    cargo: 'Escrivão de Polícia Federal',
    examDate: '2025-07-27',
    vagas: 160,
    nivel: 'superior',
    sourceUrl: 'https://cdn.cebraspe.org.br/concursos/pf_25/arquivos/Ed_1_PF_25_Abertura.pdf',
    sortOrder: 9,
    cargos: null,
    disciplinas: [
      { name: 'Direito Penal', weight: null, category: 'especifico', orderIndex: 0, topics: ['Teoria do Crime', 'Excludentes de Ilicitude', 'Crimes contra a Pessoa', 'Crimes contra o Patrimônio', 'Crimes contra a Administração Pública', 'Legislação Penal Especial'] },
      { name: 'Direito Processual Penal', weight: null, category: 'especifico', orderIndex: 1, topics: ['Inquérito Policial', 'Ação Penal', 'Prisão e Liberdade Provisória', 'Provas', 'Recursos'] },
      { name: 'Direito Constitucional', weight: null, category: 'geral', orderIndex: 2, topics: ['Direitos e Garantias Fundamentais', 'Organização do Estado', 'Segurança Pública', 'Remédios Constitucionais'] },
      { name: 'Direito Administrativo', weight: null, category: 'geral', orderIndex: 3, topics: ['Estado, Governo e Administração Pública', 'Princípios da Administração Pública', 'Organização da Administração Pública', 'Poderes Administrativos', 'Atos Administrativos', 'Licitação e Contratos Administrativos', 'Serviços Públicos', 'Bens Públicos', 'Agentes Públicos', 'Responsabilidade Civil do Estado', 'Controle da Administração Pública', 'Improbidade Administrativa', 'Intervenção do Estado na Propriedade'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 4, topics: ['Interpretação de Texto', 'Gramática', 'Redação Oficial', 'Concordância e Regência'] },
      { name: 'Contabilidade', weight: null, category: 'especifico', orderIndex: 5, topics: ['Contabilidade Geral', 'Demonstrações Contábeis', 'Análise de Balanços'] },
      { name: 'Informática', weight: null, category: 'geral', orderIndex: 6, topics: ['Segurança da Informação', 'Redes de Computadores', 'Sistemas Operacionais'] },
    ],
  },
  {
    name: 'Analista Tributário da Receita Federal',
    banca: 'FGV',
    orgao: 'Receita Federal do Brasil',
    cargo: 'Analista Tributário',
    examDate: null,
    vagas: 469,
    nivel: 'superior',
    sourceUrl: null,
    sortOrder: 10,
    cargos: null,
    disciplinas: [
      { name: 'Direito Tributário', weight: null, category: 'especifico', orderIndex: 0, topics: ['Sistema Tributário Nacional', 'Competência Tributária', 'Obrigação Tributária', 'Crédito Tributário', 'Impostos Federais', 'Legislação Tributária'] },
      { name: 'Contabilidade Geral', weight: null, category: 'especifico', orderIndex: 1, topics: ['Patrimônio', 'Demonstrações Contábeis', 'Operações com Mercadorias', 'Ativo Imobilizado'] },
      { name: 'Direito Constitucional', weight: null, category: 'geral', orderIndex: 2, topics: ['Princípios Fundamentais', 'Direitos e Garantias', 'Sistema Tributário Nacional', 'Organização do Estado'] },
      { name: 'Direito Administrativo', weight: null, category: 'geral', orderIndex: 3, topics: ['Estado, Governo e Administração Pública', 'Princípios da Administração Pública', 'Organização da Administração Pública', 'Poderes Administrativos', 'Atos Administrativos', 'Licitação e Contratos Administrativos', 'Serviços Públicos', 'Bens Públicos', 'Agentes Públicos', 'Responsabilidade Civil do Estado', 'Controle da Administração Pública', 'Improbidade Administrativa', 'Intervenção do Estado na Propriedade'] },
      { name: 'Língua Portuguesa', weight: null, category: 'geral', orderIndex: 4, topics: ['Interpretação de Texto', 'Gramática', 'Concordância e Regência'] },
      { name: 'Raciocínio Lógico', weight: null, category: 'geral', orderIndex: 5, topics: ['Proposições e Conectivos', 'Equivalências Lógicas', 'Análise Combinatória', 'Probabilidade'] },
      { name: 'Legislação Aduaneira', weight: null, category: 'especifico', orderIndex: 6, topics: ['Regulamento Aduaneiro', 'Regimes Aduaneiros', 'Despacho Aduaneiro'] },
    ],
  },
];

export async function seedEditalTemplates(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const template of SEED_TEMPLATES) {
    try {
      // Check if template already exists by name
      const [existing] = await db.select({ id: editalTemplates.id })
        .from(editalTemplates)
        .where(eq(editalTemplates.name, template.name))
        .limit(1);

      if (existing) {
        // Update existing template with latest data
        await db.update(editalTemplates)
          .set({
            banca: template.banca,
            orgao: template.orgao,
            examDate: template.examDate ? new Date(template.examDate) : null,
            disciplinas: template.disciplinas,
            cargos: template.cargos,
            vagas: template.vagas,
            nivel: template.nivel,
            sourceUrl: template.sourceUrl,
            sortOrder: template.sortOrder,
          })
          .where(eq(editalTemplates.id, existing.id));
        skipped++;
        continue;
      }

      await db.insert(editalTemplates).values({
        name: template.name,
        banca: template.banca,
        orgao: template.orgao,
        examDate: template.examDate ? new Date(template.examDate) : null,
        disciplinas: template.disciplinas,
        cargos: template.cargos,
        vagas: template.vagas,
        nivel: template.nivel,
        sourceUrl: template.sourceUrl,
        sortOrder: template.sortOrder,
        isActive: true,
      });
      inserted++;
    } catch {
      skipped++;
    }
  }

  return { inserted, skipped };
}
