export const DISCIPLINA_NAME = 'Direito Constitucional';
export const DISCIPLINA_SLUG = 'direito-constitucional';

export interface TopicManifest {
  slug: string;
  folder: string;
  topicName: string;
  imageCount: number;
}

export const TOPICS: TopicManifest[] = [
  { slug: 'topic-01', folder: 'topic-01-teoria-da-constituicao',
    topicName: 'Teoria da Constituição', imageCount: 2 },
  { slug: 'topic-02', folder: 'topic-02-principios-fundamentais',
    topicName: 'Princípios Fundamentais (Arts. 1º ao 4º)', imageCount: 2 },
  { slug: 'topic-03', folder: 'topic-03-teoria-geral-direitos-fundamentais',
    topicName: 'Teoria Geral dos Direitos Fundamentais', imageCount: 1 },
  { slug: 'topic-04', folder: 'topic-04-art-5-remedios-constitucionais',
    topicName: 'Art. 5º e Remédios Constitucionais', imageCount: 1 },
  { slug: 'topic-05', folder: 'topic-05-direitos-sociais-nacionalidade-politicos',
    topicName: 'Direitos Sociais, Nacionalidade e Direitos Políticos', imageCount: 2 },
  { slug: 'topic-06', folder: 'topic-06-organizacao-politico-administrativa',
    topicName: 'Organização Político-Administrativa e Federação', imageCount: 1 },
  { slug: 'topic-07', folder: 'topic-07-poder-legislativo',
    topicName: 'Poder Legislativo', imageCount: 2 },
  { slug: 'topic-08', folder: 'topic-08-poder-executivo',
    topicName: 'Poder Executivo', imageCount: 2 },
  { slug: 'topic-09', folder: 'topic-09-poder-judiciario-ministerio-publico',
    topicName: 'Poder Judiciário e Ministério Público', imageCount: 1 },
  { slug: 'topic-10', folder: 'topic-10-controle-constitucionalidade',
    topicName: 'Controle de Constitucionalidade', imageCount: 2 },
  { slug: 'topic-11', folder: 'topic-11-tributacao-orcamento-financas',
    topicName: 'Tributação, Orçamento e Finanças Públicas (CF/88)', imageCount: 2 },
  { slug: 'topic-12', folder: 'topic-12-ordem-economica-social',
    topicName: 'Ordem Econômica e Social', imageCount: 1 },
  { slug: 'topic-13', folder: 'topic-13-defesa-estado-instituicoes',
    topicName: 'Defesa do Estado e das Instituições Democráticas', imageCount: 2 },
  { slug: 'topic-14', folder: 'topic-14-reforma-constitucional',
    topicName: 'Reforma Constitucional', imageCount: 1 },
];
