export const DISCIPLINA_NAME = 'Administração Financeira e Orçamentária';
export const DISCIPLINA_SLUG = 'administracao-financeira-orcamentaria';

export interface TopicManifest {
  slug: string;
  folder: string;
  topicName: string;
  imageCount: number;
}

export const TOPICS: TopicManifest[] = [
  { slug: 'topic-01', folder: 'topic-01-estado-governo-atividade-financeira',
    topicName: 'Estado, Governo e Atividade Financeira do Estado', imageCount: 2 },
  { slug: 'topic-02', folder: 'topic-02-orcamento-publico-teoria-fundamentos',
    topicName: 'Orçamento Público — Teoria e Fundamentos', imageCount: 1 },
  { slug: 'topic-03', folder: 'topic-03-sistema-orcamentario-ppa-ldo-loa',
    topicName: 'Sistema Orçamentário Brasileiro — PPA, LDO e LOA', imageCount: 4 },
  { slug: 'topic-04', folder: 'topic-04-classificacoes-orcamentarias',
    topicName: 'Classificações Orçamentárias', imageCount: 1 },
  { slug: 'topic-05', folder: 'topic-05-receita-publica',
    topicName: 'Receita Pública', imageCount: 1 },
  { slug: 'topic-06', folder: 'topic-06-despesa-publica',
    topicName: 'Despesa Pública', imageCount: 1 },
  { slug: 'topic-07', folder: 'topic-07-lei-responsabilidade-fiscal',
    topicName: 'Lei de Responsabilidade Fiscal — LRF', imageCount: 6 },
  { slug: 'topic-08', folder: 'topic-08-execucao-orcamentaria-financeira',
    topicName: 'Execução Orçamentária e Financeira', imageCount: 3 },
  { slug: 'topic-09', folder: 'topic-09-divida-publica',
    topicName: 'Dívida Pública', imageCount: 1 },
  { slug: 'topic-10', folder: 'topic-10-resultado-fiscal-metas',
    topicName: 'Resultado Fiscal e Metas', imageCount: 2 },
  { slug: 'topic-11', folder: 'topic-11-transparencia-acompanhamento-fiscal',
    topicName: 'Transparência e Instrumentos de Acompanhamento Fiscal', imageCount: 1 },
  { slug: 'topic-12', folder: 'topic-12-controle-financas-publicas',
    topicName: 'Controle das Finanças Públicas', imageCount: 1 },
];
