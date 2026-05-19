export const DISCIPLINA_NAME = 'Língua Portuguesa';
export const DISCIPLINA_SLUG = 'lingua-portuguesa';

export interface TopicManifest {
  slug: string;
  folder: string;
  topicName: string;
  imageCount: number;
}

export const TOPICS: TopicManifest[] = [
  { slug: 'topic-01', folder: 'topic-01-compreensao-interpretacao',
    topicName: 'Compreensão e Interpretação de Texto', imageCount: 2 },
  { slug: 'topic-02', folder: 'topic-02-tipologia-generos-textuais',
    topicName: 'Tipologia e Gêneros Textuais', imageCount: 3 },
  { slug: 'topic-03', folder: 'topic-03-ortografia',
    topicName: 'Ortografia', imageCount: 2 },
  { slug: 'topic-04', folder: 'topic-04-morfologia',
    topicName: 'Morfologia', imageCount: 2 },
  { slug: 'topic-05', folder: 'topic-05-analise-sintatica-oracao',
    topicName: 'Análise Sintática da Oração', imageCount: 2 },
  { slug: 'topic-06', folder: 'topic-06-periodo-composto',
    topicName: 'Período Composto', imageCount: 1 },
  { slug: 'topic-07', folder: 'topic-07-regencia-verbal-nominal',
    topicName: 'Regência Verbal e Nominal', imageCount: 1 },
  { slug: 'topic-08', folder: 'topic-08-concordancia-verbal',
    topicName: 'Concordância Verbal', imageCount: 1 },
  { slug: 'topic-09', folder: 'topic-09-concordancia-nominal',
    topicName: 'Concordância Nominal', imageCount: 1 },
  { slug: 'topic-10', folder: 'topic-10-colocacao-pronominal',
    topicName: 'Colocação Pronominal', imageCount: 1 },
  { slug: 'topic-11', folder: 'topic-11-semantica-estilistica',
    topicName: 'Semântica e Estilística', imageCount: 1 },
  { slug: 'topic-12', folder: 'topic-12-pontuacao',
    topicName: 'Pontuação', imageCount: 1 },
  { slug: 'topic-13', folder: 'topic-13-crase',
    topicName: 'Crase', imageCount: 1 },
  { slug: 'topic-14', folder: 'topic-14-redacao-oficial',
    topicName: 'Redação Oficial', imageCount: 1 },
  { slug: 'topic-15', folder: 'topic-15-funcoes-linguagem',
    topicName: 'Funções da Linguagem', imageCount: 1 },
  { slug: 'topic-16', folder: 'topic-16-variacao-linguistica',
    topicName: 'Variação Linguística', imageCount: 1 },
];
