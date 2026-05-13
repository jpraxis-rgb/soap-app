export const DISCIPLINA_NAME = 'Direito Administrativo';
export const DISCIPLINA_SLUG = 'direito-administrativo';

export interface TopicManifest {
  slug: string;
  folder: string;
  topicName: string;
  imageCount: number;
}

export const TOPICS: TopicManifest[] = [
  { slug: 'topic-01', folder: 'topic-01-estado-governo-adm-publica',
    topicName: 'Estado, Governo e Administração Pública', imageCount: 1 },
  { slug: 'topic-02', folder: 'topic-02-principios-administracao-publica',
    topicName: 'Princípios da Administração Pública', imageCount: 1 },
  { slug: 'topic-03', folder: 'topic-03-organizacao-administracao-publica',
    topicName: 'Organização da Administração Pública', imageCount: 1 },
  { slug: 'topic-04', folder: 'topic-04-poderes-administrativos',
    topicName: 'Poderes Administrativos', imageCount: 2 },
  { slug: 'topic-05', folder: 'topic-05-atos-administrativos',
    topicName: 'Atos Administrativos', imageCount: 1 },
  { slug: 'topic-06', folder: 'topic-06-licitacao-contratos-administrativos',
    topicName: 'Licitação e Contratos Administrativos', imageCount: 3 },
  { slug: 'topic-07', folder: 'topic-07-servicos-publicos',
    topicName: 'Serviços Públicos', imageCount: 2 },
  { slug: 'topic-08', folder: 'topic-08-bens-publicos',
    topicName: 'Bens Públicos', imageCount: 1 },
  { slug: 'topic-09', folder: 'topic-09-agentes-publicos',
    topicName: 'Agentes Públicos', imageCount: 2 },
  { slug: 'topic-10', folder: 'topic-10-responsabilidade-civil',
    topicName: 'Responsabilidade Civil do Estado', imageCount: 2 },
  { slug: 'topic-11', folder: 'topic-11-controle-administrativo',
    topicName: 'Controle da Administração Pública', imageCount: 1 },
  { slug: 'topic-12', folder: 'topic-12-improbidade-administrativa',
    topicName: 'Improbidade Administrativa', imageCount: 1 },
  { slug: 'topic-13', folder: 'topic-13-intervencao-propriedade',
    topicName: 'Intervenção do Estado na Propriedade', imageCount: 1 },
];
