/**
 * Discipline-specific stub content for resumos (summaries).
 *
 * Provides realistic, discipline-aware content instead of generic
 * "Princípio da Legalidade" for every topic.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Section {
  heading: string;
  content: string;
  keyPoints: string[];
}

interface KeyTerm {
  term: string;
  definition: string;
}

interface Source {
  title: string;
  author?: string;
  type: string;
}

interface SummaryContent {
  sections: Section[];
  keyTerms: KeyTerm[];
  sources: Source[];
}

// ---------------------------------------------------------------------------
// SOURCES — real Brazilian references per discipline
// ---------------------------------------------------------------------------

const SOURCES: Record<string, Source[]> = {
  'Direito Tributário': [
    { title: 'Código Tributário Nacional (Lei 5.172/1966)', type: 'lei' },
    { title: 'Constituição Federal de 1988, arts. 145–162', type: 'lei' },
    { title: 'Manual de Direito Tributário', author: 'Eduardo Sabbag', type: 'doutrina' },
  ],
  'Direito Constitucional': [
    { title: 'Constituição Federal de 1988', type: 'lei' },
    { title: 'Direito Constitucional Esquematizado', author: 'Pedro Lenza', type: 'doutrina' },
    { title: 'Súmulas Vinculantes do STF', type: 'jurisprudência' },
  ],
  'Direito Administrativo': [
    { title: 'Lei 14.133/2021 (Nova Lei de Licitações)', type: 'lei' },
    { title: 'Lei 8.112/1990 (Estatuto dos Servidores)', type: 'lei' },
    { title: 'Direito Administrativo', author: 'Maria Sylvia Zanella Di Pietro', type: 'doutrina' },
  ],
  'Direito Penal': [
    { title: 'Código Penal (Decreto-Lei 2.848/1940)', type: 'lei' },
    { title: 'Constituição Federal de 1988, art. 5º', type: 'lei' },
    { title: 'Curso de Direito Penal', author: 'Rogério Greco', type: 'doutrina' },
  ],
  'Direito Processual Penal': [
    { title: 'Código de Processo Penal (Decreto-Lei 3.689/1941)', type: 'lei' },
    { title: 'Constituição Federal de 1988, art. 5º', type: 'lei' },
    { title: 'Curso de Processo Penal', author: 'Renato Brasileiro de Lima', type: 'doutrina' },
  ],
  'Direito Civil': [
    { title: 'Código Civil (Lei 10.406/2002)', type: 'lei' },
    { title: 'Constituição Federal de 1988', type: 'lei' },
    { title: 'Manual de Direito Civil', author: 'Flávio Tartuce', type: 'doutrina' },
  ],
  'Direito Processual Civil': [
    { title: 'Código de Processo Civil (Lei 13.105/2015)', type: 'lei' },
    { title: 'Constituição Federal de 1988', type: 'lei' },
    { title: 'Curso de Direito Processual Civil', author: 'Fredie Didier Jr.', type: 'doutrina' },
  ],
  'Direito Previdenciário': [
    { title: 'Lei 8.213/1991 (Plano de Benefícios da Previdência Social)', type: 'lei' },
    { title: 'Decreto 3.048/1999 (Regulamento da Previdência Social)', type: 'lei' },
    { title: 'Direito Previdenciário', author: 'Frederico Amado', type: 'doutrina' },
  ],
  'Direito do Trabalho': [
    { title: 'CLT (Decreto-Lei 5.452/1943)', type: 'lei' },
    { title: 'Constituição Federal de 1988, art. 7º', type: 'lei' },
    { title: 'Curso de Direito do Trabalho', author: 'Maurício Godinho Delgado', type: 'doutrina' },
  ],
  'Direito Processual do Trabalho': [
    { title: 'CLT, arts. 763–910', type: 'lei' },
    { title: 'Lei 5.584/1970', type: 'lei' },
    { title: 'Curso de Direito Processual do Trabalho', author: 'Mauro Schiavi', type: 'doutrina' },
  ],
  'Direito Econômico': [
    { title: 'Lei 12.529/2011 (Defesa da Concorrência)', type: 'lei' },
    { title: 'Lei 4.595/1964 (Sistema Financeiro Nacional)', type: 'lei' },
    { title: 'Direito Econômico', author: 'Leonardo Vizeu Figueiredo', type: 'doutrina' },
  ],
  'Direito Financeiro': [
    { title: 'Lei 4.320/1964 (Normas de Direito Financeiro)', type: 'lei' },
    { title: 'Lei Complementar 101/2000 (Lei de Responsabilidade Fiscal)', type: 'lei' },
    { title: 'Direito Financeiro', author: 'Harrison Leite', type: 'doutrina' },
  ],
  'Contabilidade Geral': [
    { title: 'Lei 6.404/1976 (Lei das Sociedades por Ações)', type: 'lei' },
    { title: 'Pronunciamentos do Comitê de Pronunciamentos Contábeis (CPC)', type: 'lei' },
    { title: 'Contabilidade Básica', author: 'José Carlos Marion', type: 'doutrina' },
  ],
  'Contabilidade Pública': [
    { title: 'Lei 4.320/1964 (Normas de Direito Financeiro)', type: 'lei' },
    { title: 'Manual de Contabilidade Aplicada ao Setor Público (MCASP)', type: 'lei' },
    { title: 'Normas Brasileiras de Contabilidade Aplicadas ao Setor Público (NBC TSP)', type: 'lei' },
  ],
  'Contabilidade': [
    { title: 'Lei 6.404/1976 (Lei das Sociedades por Ações)', type: 'lei' },
    { title: 'Pronunciamentos do Comitê de Pronunciamentos Contábeis (CPC)', type: 'lei' },
    { title: 'Contabilidade Básica', author: 'José Carlos Marion', type: 'doutrina' },
  ],
  'Língua Portuguesa': [
    { title: 'Nova Gramática do Português Contemporâneo', author: 'Celso Cunha & Lindley Cintra', type: 'doutrina' },
    { title: 'Moderna Gramática Portuguesa', author: 'Evanildo Bechara', type: 'doutrina' },
    { title: 'Vocabulário Ortográfico da Língua Portuguesa (VOLP) — ABL', type: 'lei' },
  ],
  'Raciocínio Lógico': [
    { title: 'Raciocínio Lógico para Concursos', author: 'Augusto César', type: 'doutrina' },
    { title: 'Lógica de Argumentação', author: 'Nílson José Machado', type: 'doutrina' },
  ],
  'Informática': [
    { title: 'Cartilha de Segurança para Internet — CERT.br', type: 'lei' },
    { title: 'ISO/IEC 27001 (Gestão de Segurança da Informação)', type: 'lei' },
    { title: 'RFC 2616 (HTTP/1.1)', type: 'lei' },
  ],
  'Economia': [
    { title: 'Economia', author: 'N. Gregory Mankiw', type: 'doutrina' },
    { title: 'Macroeconomia', author: 'Olivier Blanchard', type: 'doutrina' },
    { title: 'Microeconomia', author: 'Robert Pindyck & Daniel Rubinfeld', type: 'doutrina' },
  ],
  'Finanças': [
    { title: 'Mercado Financeiro', author: 'Alexandre Assaf Neto', type: 'doutrina' },
    { title: 'Princípios de Finanças Corporativas', author: 'Brealey, Myers & Allen', type: 'doutrina' },
  ],
  'Estatística': [
    { title: 'Estatística Básica', author: 'Wilton Bussab & Pedro Morettin', type: 'doutrina' },
    { title: 'Estatística para Concursos', author: 'Renato Oliveira', type: 'doutrina' },
  ],
  'Administração Pública': [
    { title: 'Constituição Federal de 1988, arts. 37–41', type: 'lei' },
    { title: 'Decreto-Lei 200/1967 (Organização da Administração Federal)', type: 'lei' },
    { title: 'Administração Pública', author: 'Augustinho Paludo', type: 'doutrina' },
  ],
  'Administração Financeira e Orçamentária': [
    { title: 'Lei 4.320/1964 (Normas de Direito Financeiro)', type: 'lei' },
    { title: 'Lei Complementar 101/2000 (Lei de Responsabilidade Fiscal)', type: 'lei' },
    { title: 'AFO e LRF', author: 'Sérgio Mendes', type: 'doutrina' },
  ],
  'Controle Externo': [
    { title: 'Constituição Federal de 1988, arts. 70–75', type: 'lei' },
    { title: 'Lei 8.443/1992 (Lei Orgânica do TCU)', type: 'lei' },
    { title: 'Regimento Interno do Tribunal de Contas da União', type: 'lei' },
  ],
  'Auditoria Governamental': [
    { title: 'Normas Internacionais das Entidades Fiscalizadoras Superiores (ISSAI)', type: 'lei' },
    { title: 'Normas Brasileiras de Contabilidade — NBC TA (Auditoria)', type: 'lei' },
    { title: 'Manual de Auditoria do Tribunal de Contas da União', type: 'lei' },
  ],
  'Comércio Internacional': [
    { title: 'Regulamento Aduaneiro (Decreto 6.759/2009)', type: 'lei' },
    { title: 'Nomenclatura Comum do Mercosul (NCM)', type: 'lei' },
    { title: 'Comércio Internacional', author: 'José Mota de Souza', type: 'doutrina' },
  ],
  'Ética no Serviço Público': [
    { title: 'Decreto 1.171/1994 (Código de Ética do Servidor Público)', type: 'lei' },
    { title: 'Lei 8.112/1990 (Estatuto dos Servidores)', type: 'lei' },
    { title: 'Constituição Federal de 1988, art. 37', type: 'lei' },
  ],
  'Legislação Tributária': [
    { title: 'Código Tributário Nacional (Lei 5.172/1966)', type: 'lei' },
    { title: 'Decreto 9.580/2018 (Regulamento do Imposto de Renda)', type: 'lei' },
    { title: 'Legislação Tributária Federal', author: 'Leandro Paulsen', type: 'doutrina' },
  ],
  'Legislação Especial': [
    { title: 'Lei 11.343/2006 (Lei de Drogas)', type: 'lei' },
    { title: 'Lei 10.826/2003 (Estatuto do Desarmamento)', type: 'lei' },
    { title: 'Lei 12.850/2013 (Organizações Criminosas)', type: 'lei' },
  ],
  'Legislação Aduaneira': [
    { title: 'Regulamento Aduaneiro (Decreto 6.759/2009)', type: 'lei' },
    { title: 'Instrução Normativa RFB 1.861/2018', type: 'lei' },
    { title: 'Legislação Aduaneira', author: 'Rodrigo Luz', type: 'doutrina' },
  ],
  'Legislação do INSS': [
    { title: 'Lei 8.213/1991 (Plano de Benefícios da Previdência Social)', type: 'lei' },
    { title: 'Decreto 3.048/1999 (Regulamento da Previdência Social)', type: 'lei' },
    { title: 'Instrução Normativa INSS/PRES 128/2022', type: 'lei' },
  ],
};

// ---------------------------------------------------------------------------
// KEY_TERMS — 3 accurate terms per discipline
// ---------------------------------------------------------------------------

const KEY_TERMS: Record<string, KeyTerm[]> = {
  'Direito Tributário': [
    { term: 'Fato Gerador', definition: 'Situação definida em lei como necessária e suficiente para a ocorrência da obrigação tributária principal, conforme art. 114 do CTN.' },
    { term: 'Lançamento', definition: 'Procedimento administrativo que verifica a ocorrência do fato gerador, determina a matéria tributável, calcula o montante do tributo e identifica o sujeito passivo, constituindo o crédito tributário (art. 142, CTN).' },
    { term: 'Sujeito Passivo', definition: 'Pessoa obrigada ao pagamento do tributo ou penalidade pecuniária, podendo ser contribuinte (relação pessoal e direta com o fato gerador) ou responsável (obrigação decorrente de disposição expressa de lei).' },
  ],
  'Direito Constitucional': [
    { term: 'Cláusula Pétrea', definition: 'Limitação material ao poder de reforma constitucional, prevista no art. 60, §4º da CF/88, que protege a forma federativa de Estado, o voto direto, secreto, universal e periódico, a separação dos Poderes e os direitos e garantias individuais.' },
    { term: 'Controle de Constitucionalidade', definition: 'Mecanismo de verificação da compatibilidade vertical entre normas infraconstitucionais e a Constituição, podendo ser exercido de forma difusa (por qualquer juiz) ou concentrada (pelo STF).' },
    { term: 'Poder Constituinte', definition: 'Poder de criar ou modificar a Constituição, dividido em originário (ilimitado, incondicionado, inicial) e derivado (limitado, condicionado, subordinado), este último subdividido em reformador e decorrente.' },
  ],
  'Direito Administrativo': [
    { term: 'Ato Administrativo', definition: 'Manifestação unilateral de vontade da Administração Pública que, agindo nesta qualidade, tenha por fim imediato adquirir, resguardar, transferir, modificar, extinguir e declarar direitos, ou impor obrigações aos administrados ou a si própria.' },
    { term: 'Poder de Polícia', definition: 'Atividade do Estado consistente em limitar o exercício de direitos individuais em benefício do interesse público, caracterizada pela discricionariedade, autoexecutoriedade e coercibilidade (art. 78, CTN).' },
    { term: 'Autotutela', definition: 'Poder-dever da Administração de anular seus próprios atos quando eivados de vícios de ilegalidade, ou revogá-los por motivo de conveniência e oportunidade, conforme Súmula 473 do STF.' },
  ],
  'Direito Penal': [
    { term: 'Tipicidade', definition: 'Adequação do fato praticado pelo agente ao modelo abstrato previsto na norma penal incriminadora, composta por tipicidade formal (subsunção do fato à norma) e tipicidade material (lesão ou perigo concreto de lesão ao bem jurídico tutelado).' },
    { term: 'Antijuridicidade', definition: 'Contrariedade entre o fato típico e o ordenamento jurídico como um todo, também chamada ilicitude. Pode ser afastada pelas causas excludentes: legítima defesa, estado de necessidade, estrito cumprimento do dever legal e exercício regular de direito.' },
    { term: 'Culpabilidade', definition: 'Juízo de reprovação pessoal que recai sobre a conduta do agente que praticou um fato típico e antijurídico, composta por imputabilidade, potencial consciência da ilicitude e exigibilidade de conduta diversa.' },
  ],
  'Direito Processual Penal': [
    { term: 'Inquérito Policial', definition: 'Procedimento administrativo, inquisitorial, pré-processual, conduzido pela autoridade policial, que visa apurar a autoria e materialidade da infração penal, servindo de base para a formação da opinio delicti do Ministério Público.' },
    { term: 'Ação Penal', definition: 'Direito público subjetivo de pedir ao Estado-juiz a aplicação do direito penal objetivo ao caso concreto, podendo ser pública incondicionada, pública condicionada à representação ou privada, conforme regras dos arts. 24 e seguintes do CPP.' },
    { term: 'Prisão Preventiva', definition: 'Espécie de prisão cautelar decretada pelo juiz de ofício (apenas na fase processual) ou a requerimento do MP, do querelante ou do assistente, quando presentes os requisitos do art. 312 do CPP: garantia da ordem pública, da ordem econômica, conveniência da instrução criminal ou aplicação da lei penal.' },
  ],
  'Direito Civil': [
    { term: 'Personalidade Jurídica', definition: 'Aptidão genérica para adquirir direitos e contrair obrigações na ordem civil, que se inicia com o nascimento com vida e termina com a morte, sendo resguardados os direitos do nascituro desde a concepção (arts. 1º e 2º, CC).' },
    { term: 'Negócio Jurídico', definition: 'Declaração de vontade privada destinada a produzir efeitos jurídicos correspondentes ao intento prático do agente, cujos requisitos de validade são: agente capaz, objeto lícito, possível, determinado ou determinável, e forma prescrita ou não defesa em lei (art. 104, CC).' },
    { term: 'Prescrição', definition: 'Extinção da pretensão pelo decurso do prazo legal, sem que o titular do direito tenha exercido a ação correspondente. Não corre contra incapazes e pode ser interrompida ou suspensa nos casos previstos em lei (arts. 189–206, CC).' },
  ],
  'Direito Processual Civil': [
    { term: 'Tutela Provisória', definition: 'Mecanismo processual que permite a antecipação dos efeitos da tutela definitiva ou a conservação do direito ameaçado, dividida em tutela de urgência (antecipada ou cautelar) e tutela de evidência, regulada nos arts. 294–311 do CPC/2015.' },
    { term: 'Litisconsórcio', definition: 'Pluralidade de partes num dos polos da relação processual, podendo ser ativo ou passivo, necessário ou facultativo, unitário ou simples, regulado nos arts. 113–118 do CPC/2015.' },
    { term: 'Coisa Julgada', definition: 'Autoridade que torna imutável e indiscutível a decisão de mérito não mais sujeita a recurso, produzindo efeitos entre as partes (coisa julgada formal e material), conforme art. 502 do CPC/2015.' },
  ],
  'Direito Previdenciário': [
    { term: 'Carência', definition: 'Número mínimo de contribuições mensais indispensáveis para que o beneficiário faça jus ao benefício previdenciário, prevista no art. 24 da Lei 8.213/1991.' },
    { term: 'Segurado', definition: 'Pessoa física que exerce atividade remunerada vinculada ao Regime Geral de Previdência Social ou que contribui facultativamente, classificado como obrigatório (empregado, doméstico, contribuinte individual, trabalhador avulso, segurado especial) ou facultativo.' },
    { term: 'Benefício por Incapacidade', definition: 'Prestação previdenciária devida ao segurado que se encontra incapacitado para o trabalho, podendo ser auxílio por incapacidade temporária (antigo auxílio-doença) ou aposentadoria por incapacidade permanente (antiga aposentadoria por invalidez).' },
  ],
  'Direito do Trabalho': [
    { term: 'Vínculo Empregatício', definition: 'Relação jurídica configurada pela presença simultânea de pessoalidade, habitualidade (não eventualidade), subordinação jurídica e onerosidade, conforme arts. 2º e 3º da CLT.' },
    { term: 'Jornada de Trabalho', definition: 'Período em que o empregado está à disposição do empregador, limitada a 8 horas diárias e 44 horas semanais (art. 7º, XIII, CF/88), com possibilidade de compensação e banco de horas.' },
    { term: 'Rescisão Contratual', definition: 'Extinção do contrato de trabalho, que pode se dar por pedido de demissão, dispensa sem justa causa, dispensa por justa causa, rescisão indireta ou por acordo entre as partes (art. 484-A, CLT, incluído pela Reforma Trabalhista).' },
  ],
  'Direito Processual do Trabalho': [
    { term: 'Jus Postulandi', definition: 'Capacidade de a parte (empregado ou empregador) postular pessoalmente em juízo na Justiça do Trabalho, sem necessidade de advogado, nas Varas do Trabalho e nos TRTs, conforme art. 791 da CLT.' },
    { term: 'Audiência Trabalhista', definition: 'Ato processual concentrado e uno, em que se tentam a conciliação, apresentam-se defesa e provas e profere-se sentença, regida pelo princípio da oralidade (arts. 843–852 da CLT).' },
    { term: 'Execução Trabalhista', definition: 'Fase processual destinada ao cumprimento forçado do título executivo judicial ou extrajudicial, com impulso oficial do juiz e aplicação subsidiária da Lei de Execução Fiscal e do CPC (arts. 876–892 da CLT).' },
  ],
  'Direito Econômico': [
    { term: 'Abuso de Poder Econômico', definition: 'Prática anticompetitiva que visa à dominação de mercados, à eliminação da concorrência e ao aumento arbitrário de lucros, reprimida pela Lei 12.529/2011 e pelo art. 173, §4º da CF/88.' },
    { term: 'CADE', definition: 'Conselho Administrativo de Defesa Econômica, autarquia federal vinculada ao Ministério da Justiça, responsável por julgar e prevenir infrações à ordem econômica, composta por Tribunal Administrativo, Superintendência-Geral e Departamento de Estudos Econômicos.' },
    { term: 'Mercado Relevante', definition: 'Delimitação do espaço geográfico e do produto/serviço em que se verifica a concorrência efetiva, utilizado como parâmetro para análise de atos de concentração e condutas anticoncorrenciais.' },
  ],
  'Direito Financeiro': [
    { term: 'Orçamento Público', definition: 'Lei formal que estima receitas e fixa despesas para um exercício financeiro, compondo o sistema orçamentário brasileiro formado pelo PPA, LDO e LOA, conforme arts. 165–169 da CF/88.' },
    { term: 'Crédito Adicional', definition: 'Autorização de despesa não computada ou insuficientemente dotada na LOA, classificados em suplementares (reforço de dotação), especiais (despesas sem dotação específica) e extraordinários (despesas urgentes e imprevistas), conforme arts. 40–46 da Lei 4.320/1964.' },
    { term: 'Responsabilidade Fiscal', definition: 'Conjunto de normas de finanças públicas voltadas para a gestão fiscal responsável, com planejamento, transparência, controle e cumprimento de metas, conforme a LC 101/2000 (Lei de Responsabilidade Fiscal).' },
  ],
  'Contabilidade Geral': [
    { term: 'Patrimônio Líquido', definition: 'Diferença entre o ativo e o passivo da entidade, representando os recursos próprios dos sócios ou acionistas, composto por capital social, reservas de capital, ajustes de avaliação patrimonial, reservas de lucros, ações em tesouraria e prejuízos acumulados.' },
    { term: 'Regime de Competência', definition: 'Princípio contábil segundo o qual as receitas e despesas devem ser reconhecidas no período a que competem, independentemente do recebimento ou pagamento, conforme CPC 00 e art. 177 da Lei 6.404/1976.' },
    { term: 'Demonstração do Resultado do Exercício (DRE)', definition: 'Demonstração contábil que apresenta de forma resumida as operações realizadas pela empresa no período, evidenciando o resultado líquido (lucro ou prejuízo), elaborada conforme art. 187 da Lei 6.404/1976.' },
  ],
  'Contabilidade Pública': [
    { term: 'Balanço Orçamentário', definition: 'Demonstração contábil que evidencia as receitas e despesas previstas em confronto com as realizadas, demonstrando o resultado orçamentário (superávit ou déficit), conforme art. 102 da Lei 4.320/1964 e MCASP.' },
    { term: 'Variações Patrimoniais', definition: 'Alterações no patrimônio público classificadas em variações patrimoniais aumentativas (VPA) e diminutivas (VPD), que independem da execução orçamentária, conforme as NBC TSP e o MCASP.' },
    { term: 'PCASP', definition: 'Plano de Contas Aplicado ao Setor Público, estrutura padronizada de contas contábeis para todas as entidades do setor público brasileiro, organizado em 8 classes conforme o MCASP.' },
  ],
  'Contabilidade': [
    { term: 'Patrimônio Líquido', definition: 'Diferença entre o ativo e o passivo da entidade, representando os recursos próprios dos sócios ou acionistas, composto por capital social, reservas de capital, ajustes de avaliação patrimonial, reservas de lucros, ações em tesouraria e prejuízos acumulados.' },
    { term: 'Regime de Competência', definition: 'Princípio contábil segundo o qual as receitas e despesas devem ser reconhecidas no período a que competem, independentemente do recebimento ou pagamento, conforme CPC 00 e art. 177 da Lei 6.404/1976.' },
    { term: 'Demonstração do Resultado do Exercício (DRE)', definition: 'Demonstração contábil que apresenta de forma resumida as operações realizadas pela empresa no período, evidenciando o resultado líquido (lucro ou prejuízo), elaborada conforme art. 187 da Lei 6.404/1976.' },
  ],
  'Língua Portuguesa': [
    { term: 'Concordância Verbal', definition: 'Regra gramatical que exige a flexão do verbo em número e pessoa para concordar com o sujeito da oração, incluindo casos especiais como sujeito composto, partícula "se" e verbos impessoais.' },
    { term: 'Regência Verbal', definition: 'Relação de subordinação entre o verbo e seu complemento, determinando se o verbo é transitivo direto, transitivo indireto ou bitransitivo, e qual preposição deve ser empregada.' },
    { term: 'Crase', definition: 'Fusão da preposição "a" com o artigo definido feminino "a" ou com pronomes demonstrativos, indicada pelo acento grave (`), sendo obrigatória, facultativa ou proibida conforme regras específicas.' },
  ],
  'Raciocínio Lógico': [
    { term: 'Proposição', definition: 'Sentença declarativa à qual se pode atribuir um único valor lógico: verdadeiro (V) ou falso (F). Sentenças interrogativas, exclamativas e imperativas não são proposições.' },
    { term: 'Tabela-Verdade', definition: 'Dispositivo utilizado para determinar o valor lógico de proposições compostas a partir dos valores lógicos das proposições simples que as compõem, analisando todas as combinações possíveis.' },
    { term: 'Equivalência Lógica', definition: 'Relação entre duas proposições compostas que possuem a mesma tabela-verdade, ou seja, assumem o mesmo valor lógico para todas as combinações de valores das proposições simples componentes.' },
  ],
  'Informática': [
    { term: 'Protocolo TCP/IP', definition: 'Conjunto de protocolos de comunicação que forma a base da Internet, organizado em quatro camadas: aplicação, transporte, rede (internet) e acesso à rede (enlace), permitindo a comunicação entre dispositivos heterogêneos.' },
    { term: 'Firewall', definition: 'Sistema de segurança que monitora e controla o tráfego de rede com base em regras predefinidas, podendo ser implementado em hardware ou software, atuando como barreira entre redes confiáveis e não confiáveis.' },
    { term: 'Computação em Nuvem', definition: 'Modelo de entrega de serviços de TI sob demanda pela Internet, classificado em IaaS (infraestrutura), PaaS (plataforma) e SaaS (software), com modelos de implantação pública, privada, híbrida e comunitária.' },
  ],
  'Economia': [
    { term: 'Oferta e Demanda', definition: 'Modelo econômico fundamental que descreve como o preço e a quantidade de um bem são determinados pela interação entre vendedores (oferta) e compradores (demanda) em um mercado competitivo, alcançando o equilíbrio onde as curvas se cruzam.' },
    { term: 'PIB (Produto Interno Bruto)', definition: 'Soma de todos os bens e serviços finais produzidos dentro das fronteiras de um país em um determinado período, medido pelas óticas da produção, renda e despesa, sendo o principal indicador de atividade econômica.' },
    { term: 'Inflação', definition: 'Aumento generalizado e persistente no nível geral de preços de uma economia ao longo do tempo, medida por índices como IPCA e IGP-M, causando perda do poder de compra da moeda.' },
  ],
  'Finanças': [
    { term: 'Valor Presente Líquido (VPL)', definition: 'Critério de avaliação de investimentos que consiste em trazer a valor presente todos os fluxos de caixa futuros esperados, descontados a uma taxa mínima de atratividade, subtraindo o investimento inicial. Projeto é viável quando VPL > 0.' },
    { term: 'CAPM (Capital Asset Pricing Model)', definition: 'Modelo de precificação de ativos que relaciona o retorno esperado de um ativo ao seu risco sistemático (beta), estabelecendo que o prêmio de risco é proporcional ao beta multiplicado pelo prêmio de risco de mercado.' },
    { term: 'Taxa Selic', definition: 'Taxa básica de juros da economia brasileira, definida pelo COPOM (Comitê de Política Monetária do Banco Central), que serve de referência para as demais taxas de juros praticadas no mercado financeiro.' },
  ],
  'Estatística': [
    { term: 'Média Aritmética', definition: 'Medida de tendência central obtida pela soma de todos os valores de um conjunto de dados dividida pelo número total de observações. Sensível a valores extremos (outliers).' },
    { term: 'Desvio Padrão', definition: 'Medida de dispersão que indica o grau de variação dos dados em relação à média, calculada como a raiz quadrada da variância. Quanto maior o desvio padrão, mais dispersos estão os dados.' },
    { term: 'Distribuição Normal', definition: 'Distribuição de probabilidade contínua, simétrica em relação à média, em forma de sino (curva de Gauss), completamente definida por dois parâmetros: média (μ) e desvio padrão (σ). Aproximadamente 68% dos dados estão a 1σ da média.' },
  ],
  'Administração Pública': [
    { term: 'Princípios da Administração Pública', definition: 'Princípios constitucionais expressos no art. 37 da CF/88 — legalidade, impessoalidade, moralidade, publicidade e eficiência (LIMPE) — que vinculam a atuação de toda a administração pública direta e indireta.' },
    { term: 'Administração Gerencial', definition: 'Modelo de gestão pública focado em resultados, descentralização, flexibilidade e controle a posteriori, que emergiu no Brasil com a Reforma do Aparelho do Estado de 1995 (PDRAE), em contraposição ao modelo burocrático weberiano.' },
    { term: 'Governança Pública', definition: 'Conjunto de mecanismos de liderança, estratégia e controle postos em prática para avaliar, direcionar e monitorar a gestão, com vistas à condução de políticas públicas e à prestação de serviços de interesse da sociedade (Decreto 9.203/2017).' },
  ],
  'Administração Financeira e Orçamentária': [
    { term: 'Ciclo Orçamentário', definition: 'Sequência de etapas que compõem o processo orçamentário: elaboração do projeto de lei orçamentária, apreciação legislativa, execução e acompanhamento, e controle e avaliação, envolvendo os três instrumentos de planejamento (PPA, LDO e LOA).' },
    { term: 'Princípio da Anualidade Orçamentária', definition: 'Princípio segundo o qual a autorização legislativa para a realização de despesas deve ser renovada a cada exercício financeiro, que no Brasil coincide com o ano civil (1º de janeiro a 31 de dezembro).' },
    { term: 'Restos a Pagar', definition: 'Despesas empenhadas mas não pagas até 31 de dezembro, classificadas em processadas (liquidadas) e não processadas (não liquidadas), inscritas no exercício seguinte conforme art. 36 da Lei 4.320/1964.' },
  ],
  'Controle Externo': [
    { term: 'Tribunal de Contas', definition: 'Órgão constitucional autônomo, sem subordinação hierárquica a qualquer Poder, incumbido de auxiliar o Poder Legislativo no exercício do controle externo da administração pública, com competências previstas nos arts. 71–74 da CF/88.' },
    { term: 'Tomada de Contas Especial', definition: 'Processo administrativo instaurado para apurar responsabilidade por dano ao erário decorrente de omissão no dever de prestar contas, prática de ato ilegal, ilegítimo, antieconômico ou desfalque de dinheiro público.' },
    { term: 'Parecer Prévio', definition: 'Pronunciamento do Tribunal de Contas sobre as contas anuais prestadas pelo chefe do Poder Executivo, de caráter opinativo, que só pode ser rejeitado por decisão de dois terços dos membros do Legislativo (art. 71, I, CF/88).' },
  ],
  'Auditoria Governamental': [
    { term: 'Auditoria de Conformidade', definition: 'Modalidade de auditoria que verifica se a gestão dos recursos públicos obedece às normas legais e regulamentares aplicáveis, avaliando a legalidade, legitimidade e economicidade dos atos administrativos.' },
    { term: 'Auditoria Operacional', definition: 'Modalidade de auditoria que avalia o desempenho de órgãos e programas governamentais quanto à eficiência, eficácia, efetividade e economicidade, propondo recomendações para aprimorar a gestão.' },
    { term: 'Materialidade', definition: 'Conceito que estabelece o nível de relevância a partir do qual distorções ou omissões, individualmente ou em conjunto, podem influenciar as decisões dos usuários das demonstrações contábeis ou relatórios de auditoria.' },
  ],
  'Comércio Internacional': [
    { term: 'Classificação Fiscal de Mercadorias', definition: 'Enquadramento de produtos na Nomenclatura Comum do Mercosul (NCM) com base no Sistema Harmonizado (SH), determinando alíquotas de impostos, tratamentos administrativos e estatísticas de comércio exterior.' },
    { term: 'Incoterms', definition: 'Termos internacionais de comércio publicados pela Câmara de Comércio Internacional (CCI) que definem responsabilidades entre comprador e vendedor no transporte internacional, incluindo custos, riscos e obrigações documentais.' },
    { term: 'Drawback', definition: 'Regime aduaneiro especial que permite a importação de insumos com suspensão, isenção ou restituição de tributos, condicionada à sua utilização na industrialização de produtos destinados à exportação (art. 383, Regulamento Aduaneiro).' },
  ],
  'Ética no Serviço Público': [
    { term: 'Moralidade Administrativa', definition: 'Princípio constitucional (art. 37, CF/88) que impõe ao agente público o dever de atuar com probidade, boa-fé, lealdade e honestidade, indo além da mera legalidade para abranger padrões éticos de conduta.' },
    { term: 'Conflito de Interesses', definition: 'Situação em que o interesse pessoal do agente público conflita com o interesse público, comprometendo sua imparcialidade, regulado pela Lei 12.813/2013 e pelo Decreto 1.171/1994.' },
    { term: 'Comissão de Ética', definition: 'Colegiado responsável por orientar e aconselhar sobre ética profissional do servidor no âmbito de cada órgão, apurar infrações ao Código de Ética e aplicar a pena de censura, conforme Decreto 1.171/1994.' },
  ],
  'Legislação Tributária': [
    { term: 'Obrigação Tributária', definition: 'Relação jurídica que surge com a ocorrência do fato gerador, podendo ser principal (pagamento de tributo ou penalidade) ou acessória (prestações de fazer ou não fazer previstas na legislação tributária), conforme arts. 113–115 do CTN.' },
    { term: 'Imunidade Tributária', definition: 'Vedação constitucional ao exercício da competência tributária, que impede a incidência de tributos sobre determinadas pessoas, bens ou situações, prevista nos arts. 150, VI, 153, §3º, e 155, §2º, X da CF/88.' },
    { term: 'Decadência Tributária', definition: 'Extinção do direito da Fazenda Pública de constituir o crédito tributário pelo lançamento, cujo prazo é de 5 anos contados conforme as regras dos arts. 150, §4º e 173 do CTN.' },
  ],
  'Legislação Especial': [
    { term: 'Tráfico de Drogas', definition: 'Crime previsto no art. 33 da Lei 11.343/2006, que tipifica as condutas de importar, exportar, preparar, produzir, fabricar, adquirir, vender, expor à venda, oferecer, ter em depósito, transportar, trazer consigo ou guardar drogas sem autorização legal.' },
    { term: 'Organização Criminosa', definition: 'Associação de 4 ou mais pessoas estruturalmente ordenada, com divisão de tarefas, voltada à obtenção de vantagem mediante a prática de infrações penais com penas máximas superiores a 4 anos, conforme art. 1º, §1º da Lei 12.850/2013.' },
    { term: 'Posse de Arma de Fogo', definition: 'Manter arma de fogo no interior de residência ou local de trabalho, exigindo-se registro no órgão competente (Sinarm ou Sigma), conforme arts. 12 e 13 da Lei 10.826/2003 (Estatuto do Desarmamento).' },
  ],
  'Legislação Aduaneira': [
    { term: 'Despacho Aduaneiro', definition: 'Procedimento fiscal mediante o qual se verifica a exatidão dos dados declarados pelo importador ou exportador em relação à mercadoria, documentos e legislação específica, culminando no desembaraço aduaneiro (art. 542, Regulamento Aduaneiro).' },
    { term: 'Regime Aduaneiro Especial', definition: 'Procedimento que permite importar ou exportar mercadorias com suspensão ou isenção de tributos, condicionados a requisitos específicos, como trânsito aduaneiro, admissão temporária, drawback e entreposto aduaneiro.' },
    { term: 'Valor Aduaneiro', definition: 'Base de cálculo do imposto de importação, determinado conforme o Acordo de Valoração Aduaneira (AVA/GATT), tendo como método principal o valor de transação, ou seja, o preço efetivamente pago ou a pagar pela mercadoria importada.' },
  ],
  'Legislação do INSS': [
    { term: 'Aposentadoria Programada', definition: 'Benefício previdenciário concedido ao segurado que cumpre idade mínima e tempo de contribuição, conforme regras da EC 103/2019 (Reforma da Previdência), que unificou as antigas aposentadorias por idade e por tempo de contribuição.' },
    { term: 'Salário de Contribuição', definition: 'Base de cálculo das contribuições previdenciárias, correspondente à remuneração do segurado empregado, ao pró-labore do contribuinte individual, ou ao valor declarado pelo segurado facultativo, respeitados os limites mínimo e máximo (art. 28, Lei 8.212/1991).' },
    { term: 'Benefício por Incapacidade Temporária', definition: 'Benefício previdenciário devido ao segurado que fica incapacitado para o trabalho por mais de 15 dias consecutivos, exigindo carência de 12 contribuições (salvo exceções), com renda mensal de 91% do salário de benefício (art. 59, Lei 8.213/1991).' },
  ],
};

// ---------------------------------------------------------------------------
// Discipline family classification
// ---------------------------------------------------------------------------

type DisciplineFamily =
  | 'legal'
  | 'accounting'
  | 'math'
  | 'economics'
  | 'portuguese'
  | 'tech'
  | 'admin'
  | 'trade';

function getDisciplineFamily(disciplina: string): DisciplineFamily {
  const d = disciplina.toLowerCase();

  if (d.startsWith('direito') || d.startsWith('legislação')) return 'legal';
  if (d.startsWith('contabilidade')) return 'accounting';
  if (d === 'raciocínio lógico' || d === 'estatística') return 'math';
  if (d === 'economia' || d === 'finanças') return 'economics';
  if (d === 'língua portuguesa') return 'portuguese';
  if (d === 'informática') return 'tech';
  if (
    d.startsWith('administração') ||
    d.startsWith('ética') ||
    d.startsWith('controle') ||
    d.startsWith('auditoria')
  )
    return 'admin';
  if (d === 'comércio internacional') return 'trade';

  // Fallback heuristic
  if (d.includes('direito') || d.includes('legislação') || d.includes('lei')) return 'legal';
  if (d.includes('contab')) return 'accounting';
  if (d.includes('lógic') || d.includes('estatístic') || d.includes('matemátic')) return 'math';
  if (d.includes('econom') || d.includes('finanç')) return 'economics';
  if (d.includes('portugu')) return 'portuguese';
  if (d.includes('informátic') || d.includes('tecnolog')) return 'tech';
  if (d.includes('administr') || d.includes('ética') || d.includes('auditor')) return 'admin';
  if (d.includes('comércio') || d.includes('aduane')) return 'trade';

  return 'legal'; // safe default for concurso context
}

// ---------------------------------------------------------------------------
// Family-based section templates
// ---------------------------------------------------------------------------

function generateSections(topic: string, disciplina: string, family: DisciplineFamily): Section[] {
  switch (family) {
    case 'legal':
      return [
        {
          heading: `Fundamentos de ${topic}`,
          content:
            `${topic} é um dos temas centrais de ${disciplina} frequentemente cobrado em concursos públicos. ` +
            `Sua compreensão exige o domínio da base constitucional e da legislação infraconstitucional que disciplina a matéria. ` +
            `O estudo de ${topic} em ${disciplina} demanda atenção tanto à letra da lei quanto à interpretação doutrinária e jurisprudencial consolidada.`,
          keyPoints: [
            `${topic} possui fundamento constitucional e regulamentação em legislação específica de ${disciplina}`,
            `A doutrina majoritária em ${disciplina} estabelece requisitos e classificações próprias para ${topic}`,
            `O entendimento dos tribunais superiores sobre ${topic} tem evoluído e deve ser acompanhado pelo candidato`,
          ],
        },
        {
          heading: 'Base Normativa e Doutrina',
          content:
            `Os dispositivos legais que regulam ${topic} em ${disciplina} devem ser estudados de forma sistemática, correlacionando a norma com os princípios constitucionais aplicáveis. ` +
            `A doutrina brasileira oferece importantes contribuições para a interpretação de ${topic}, especialmente quanto à sua aplicação prática. ` +
            `As súmulas e decisões dos tribunais superiores complementam o estudo, consolidando entendimentos sobre aspectos controvertidos de ${topic}.`,
          keyPoints: [
            `A legislação pertinente a ${topic} deve ser estudada em conjunto com os princípios gerais de ${disciplina}`,
            `Doutrinadores de referência em ${disciplina} apresentam classificações e interpretações essenciais sobre ${topic}`,
            `A jurisprudência recente dos tribunais superiores tem pacificado questões polêmicas relacionadas a ${topic}`,
          ],
        },
        {
          heading: `Questões de Concurso sobre ${topic}`,
          content:
            `As bancas examinadoras costumam cobrar ${topic} de forma literal, exigindo o conhecimento do texto normativo, mas também de forma interpretativa, cobrando a aplicação dos conceitos a casos concretos. ` +
            `É comum a cobrança da diferenciação entre institutos semelhantes dentro de ${disciplina}. ` +
            `O candidato deve estar atento a pegadinhas envolvendo exceções e alterações legislativas recentes sobre ${topic}.`,
          keyPoints: [
            `Questões sobre ${topic} frequentemente misturam conceitos próximos para confundir o candidato`,
            `Alterações legislativas recentes em ${disciplina} são alvo frequente de cobrança sobre ${topic}`,
            `Memorizar dispositivos-chave e súmulas sobre ${topic} é essencial para acertar questões objetivas`,
          ],
        },
      ];

    case 'accounting':
      return [
        {
          heading: `Conceitos de ${topic}`,
          content:
            `${topic} é um tema fundamental em ${disciplina}, com tratamento específico nos pronunciamentos contábeis brasileiros e nas normas internacionais. ` +
            `A correta compreensão de ${topic} exige o domínio dos conceitos contábeis básicos e da estrutura conceitual vigente. ` +
            `Em ${disciplina}, ${topic} é frequentemente cobrado em provas de concursos para cargos na área fiscal e de controle.`,
          keyPoints: [
            `${topic} é regulado por pronunciamentos do CPC e normas aplicáveis a ${disciplina}`,
            `A compreensão de ${topic} exige domínio da estrutura conceitual básica da contabilidade`,
            `Concursos cobram tanto a teoria quanto a aplicação prática de ${topic} em ${disciplina}`,
          ],
        },
        {
          heading: 'Registro e Mensuração',
          content:
            `O registro contábil de ${topic} segue critérios específicos de mensuração e reconhecimento definidos nas normas contábeis aplicáveis. ` +
            `Os lançamentos envolvendo ${topic} devem respeitar o método das partidas dobradas e os critérios de avaliação patrimonial. ` +
            `A mensuração de ${topic} pode envolver custo histórico, valor justo, valor realizável líquido ou valor presente, conforme a norma específica.`,
          keyPoints: [
            `Os lançamentos contábeis de ${topic} seguem o método das partidas dobradas com critérios específicos de mensuração`,
            `Os critérios de avaliação aplicáveis a ${topic} incluem custo histórico, valor justo e valor presente`,
            `Erros no registro de ${topic} podem afetar múltiplas demonstrações contábeis simultaneamente`,
          ],
        },
        {
          heading: 'Aplicação em Provas',
          content:
            `Questões de concurso sobre ${topic} em ${disciplina} frequentemente exigem cálculos e interpretação de demonstrações contábeis. ` +
            `É comum a cobrança de lançamentos contábeis, classificação de contas e efeitos no patrimônio relacionados a ${topic}. ` +
            `O candidato deve dominar os cálculos típicos e saber identificar os impactos de ${topic} no balanço patrimonial e na DRE.`,
          keyPoints: [
            `Questões sobre ${topic} exigem habilidade com cálculos e lançamentos contábeis`,
            `É fundamental saber classificar corretamente as contas relacionadas a ${topic}`,
            `O candidato deve identificar os impactos de ${topic} no balanço patrimonial e na DRE`,
          ],
        },
      ];

    case 'math':
      return [
        {
          heading: `Fundamentos de ${topic}`,
          content:
            `${topic} é um dos pilares de ${disciplina}, sendo cobrado com frequência em provas de concursos de todas as áreas. ` +
            `O domínio das definições, axiomas e propriedades fundamentais de ${topic} é pré-requisito para a resolução dos problemas mais elaborados. ` +
            `Em ${disciplina}, ${topic} se conecta com diversos outros temas, exigindo uma visão integrada do conteúdo.`,
          keyPoints: [
            `As definições e propriedades fundamentais de ${topic} são a base para resolução de questões`,
            `${topic} em ${disciplina} exige raciocínio estruturado e domínio de linguagem formal`,
            `A conexão entre ${topic} e outros conteúdos de ${disciplina} é frequentemente explorada em provas`,
          ],
        },
        {
          heading: 'Métodos de Resolução',
          content:
            `A resolução de questões sobre ${topic} envolve técnicas específicas e fórmulas que devem ser memorizadas e praticadas. ` +
            `Abordagens passo a passo ajudam a organizar o raciocínio e evitar erros comuns na resolução de problemas de ${topic}. ` +
            `O candidato deve conhecer métodos alternativos de resolução para otimizar o tempo de prova em questões de ${topic}.`,
          keyPoints: [
            `Fórmulas e técnicas de ${topic} devem ser memorizadas e praticadas com exercícios`,
            `A resolução passo a passo reduz erros em questões de ${topic}`,
            `Métodos alternativos de resolução podem economizar tempo precioso na prova`,
          ],
        },
        {
          heading: 'Estratégias para Provas',
          content:
            `Em provas de ${disciplina}, questões de ${topic} podem ser resolvidas de forma mais rápida com o uso de atalhos e propriedades especiais. ` +
            `Padrões recorrentes nas provas das principais bancas permitem ao candidato antecipar o tipo de raciocínio exigido em ${topic}. ` +
            `A prática com questões anteriores é a melhor estratégia para consolidar o domínio de ${topic} e ganhar velocidade.`,
          keyPoints: [
            `Atalhos e propriedades especiais aceleram a resolução de questões de ${topic}`,
            `As bancas examinadoras seguem padrões recorrentes ao cobrar ${topic}`,
            `Resolver questões anteriores é essencial para consolidar o domínio de ${topic}`,
          ],
        },
      ];

    case 'economics':
      return [
        {
          heading: `Teoria de ${topic}`,
          content:
            `${topic} é um tema central em ${disciplina}, com base em modelos teóricos que buscam explicar o comportamento dos agentes econômicos. ` +
            `A compreensão de ${topic} exige familiaridade com hipóteses simplificadoras, variáveis-chave e relações de causalidade. ` +
            `Os modelos clássicos e contemporâneos de ${topic} oferecem perspectivas complementares para análise de fenômenos econômicos.`,
          keyPoints: [
            `${topic} fundamenta-se em modelos teóricos com hipóteses e variáveis bem definidas`,
            `A análise de ${topic} exige compreensão das relações de causalidade entre variáveis econômicas`,
            `Diferentes escolas de pensamento econômico oferecem interpretações distintas de ${topic}`,
          ],
        },
        {
          heading: 'Modelos e Aplicações',
          content:
            `Os modelos matemáticos e gráficos de ${topic} permitem análises quantitativas e previsões sobre o comportamento dos mercados. ` +
            `A análise de equilíbrio é fundamental para compreender como ${topic} se manifesta na prática. ` +
            `Representações gráficas de ${topic} são frequentemente cobradas em provas de ${disciplina}.`,
          keyPoints: [
            `Modelos gráficos de ${topic} devem ser dominados para análise de equilíbrio`,
            `A representação matemática de ${topic} permite análises quantitativas precisas`,
            `Questões de concurso sobre ${topic} frequentemente utilizam gráficos e cálculos`,
          ],
        },
        {
          heading: 'Contexto Brasileiro',
          content:
            `A aplicação de ${topic} ao contexto brasileiro envolve particularidades institucionais e políticas que devem ser consideradas. ` +
            `A política econômica brasileira e seus instrumentos de intervenção estão diretamente relacionados com ${topic}. ` +
            `O candidato deve conhecer os indicadores e instituições brasileiras relevantes para a análise de ${topic}.`,
          keyPoints: [
            `${topic} deve ser analisado considerando as particularidades da economia brasileira`,
            `Instrumentos de política econômica brasileira se relacionam diretamente com ${topic}`,
            `Indicadores e instituições brasileiras são frequentemente cobrados em questões sobre ${topic}`,
          ],
        },
      ];

    case 'portuguese':
      return [
        {
          heading: `Conceitos de ${topic}`,
          content:
            `${topic} é um dos temas mais cobrados em ${disciplina} nos concursos públicos brasileiros. ` +
            `A compreensão de ${topic} exige o domínio das regras gramaticais e de suas aplicações práticas em textos. ` +
            `O estudo de ${topic} em ${disciplina} deve integrar teoria gramatical, análise textual e prática com questões.`,
          keyPoints: [
            `${topic} é um dos conteúdos mais recorrentes em provas de ${disciplina}`,
            `O domínio de ${topic} exige conhecimento tanto das regras quanto de suas exceções`,
            `A integração entre teoria gramatical e interpretação de texto é essencial para ${topic}`,
          ],
        },
        {
          heading: 'Regras e Exceções',
          content:
            `As regras de ${topic} são estabelecidas pela norma culta e possuem exceções que as bancas exploram com frequência. ` +
            `O candidato deve memorizar as regras fundamentais de ${topic} e conhecer as situações especiais e facultativas. ` +
            `Armadilhas em questões de ${topic} geralmente envolvem exceções ou construções ambíguas que exigem atenção redobrada.`,
          keyPoints: [
            `As regras fundamentais de ${topic} devem ser memorizadas conforme a norma culta`,
            `As exceções e casos facultativos de ${topic} são os principais alvos das bancas`,
            `Construções ambíguas envolvendo ${topic} são frequentemente usadas como pegadinhas`,
          ],
        },
        {
          heading: 'Interpretação de Texto',
          content:
            `${topic} aparece em questões de interpretação de texto como elemento linguístico que pode alterar o sentido de um enunciado. ` +
            `O candidato deve perceber como ${topic} contribui para a coesão e coerência textual. ` +
            `Provas recentes têm cobrado ${topic} de forma contextualizada, exigindo leitura atenta e análise crítica do texto.`,
          keyPoints: [
            `${topic} pode alterar o sentido do texto e deve ser analisado contextualmente`,
            `A relação entre ${topic} e a coesão textual é frequentemente explorada em provas`,
            `Questões contextualizadas sobre ${topic} exigem leitura atenta e raciocínio crítico`,
          ],
        },
      ];

    case 'tech':
      return [
        {
          heading: `Fundamentos de ${topic}`,
          content:
            `${topic} é um tema essencial em ${disciplina} para concursos públicos, abrangendo conceitos técnicos e aplicações práticas. ` +
            `A compreensão de ${topic} exige familiaridade com a arquitetura de sistemas, protocolos e padrões da área. ` +
            `Em ${disciplina}, ${topic} é cobrado tanto em nível conceitual quanto em questões práticas de uso cotidiano.`,
          keyPoints: [
            `${topic} envolve conceitos técnicos fundamentais que o candidato deve dominar`,
            `A arquitetura e os componentes de ${topic} são frequentemente cobrados em provas`,
            `${topic} é cobrado tanto em questões teóricas quanto práticas em ${disciplina}`,
          ],
        },
        {
          heading: 'Aspectos Técnicos',
          content:
            `Os aspectos técnicos de ${topic} incluem protocolos, padrões e especificações que regulam seu funcionamento. ` +
            `O candidato deve conhecer a terminologia técnica associada a ${topic} e compreender como os diferentes componentes interagem. ` +
            `As normas e padrões internacionais aplicáveis a ${topic} são referência para questões de concurso em ${disciplina}.`,
          keyPoints: [
            `Protocolos e padrões técnicos de ${topic} devem ser conhecidos em detalhe`,
            `A terminologia técnica de ${topic} é cobrada com frequência nas provas`,
            `Normas internacionais aplicáveis a ${topic} são referência obrigatória`,
          ],
        },
        {
          heading: 'Segurança e Boas Práticas',
          content:
            `A segurança da informação relacionada a ${topic} é um aspecto cada vez mais cobrado em concursos de ${disciplina}. ` +
            `Boas práticas de utilização de ${topic} incluem medidas preventivas, políticas de segurança e procedimentos de contingência. ` +
            `O candidato deve conhecer os principais riscos e contramedidas associados a ${topic} em ambientes corporativos.`,
          keyPoints: [
            `A segurança relacionada a ${topic} é foco crescente em provas de ${disciplina}`,
            `Boas práticas e políticas de segurança para ${topic} devem ser conhecidas`,
            `Riscos e contramedidas de ${topic} em ambientes corporativos são cobrados com frequência`,
          ],
        },
      ];

    case 'admin':
      return [
        {
          heading: `Conceitos de ${topic}`,
          content:
            `${topic} é um tema relevante em ${disciplina}, com base em teorias administrativas e princípios de gestão pública. ` +
            `A compreensão de ${topic} exige o domínio do referencial teórico e do marco legal aplicável. ` +
            `Em ${disciplina}, ${topic} é cobrado em concursos para cargos de gestão, controle e planejamento governamental.`,
          keyPoints: [
            `${topic} fundamenta-se em teorias administrativas e princípios de gestão pública`,
            `O referencial teórico e o marco legal de ${topic} devem ser estudados em conjunto`,
            `Concursos para cargos de gestão e controle frequentemente cobram ${topic} em ${disciplina}`,
          ],
        },
        {
          heading: 'Marco Legal',
          content:
            `O marco legal de ${topic} em ${disciplina} abrange dispositivos constitucionais, leis e regulamentos que disciplinam a matéria. ` +
            `A Constituição Federal estabelece os princípios e regras gerais aplicáveis a ${topic}, complementados por legislação infraconstitucional específica. ` +
            `O candidato deve conhecer a evolução normativa de ${topic} e as alterações legislativas recentes.`,
          keyPoints: [
            `A base constitucional de ${topic} está nos princípios e regras do Título III da CF/88`,
            `A legislação infraconstitucional complementa e detalha a regulamentação de ${topic}`,
            `Alterações legislativas recentes sobre ${topic} são frequentemente cobradas em provas`,
          ],
        },
        {
          heading: 'Aplicação na Gestão Pública',
          content:
            `A aplicação prática de ${topic} na gestão pública envolve processos, instrumentos e mecanismos de controle. ` +
            `As reformas administrativas brasileiras incorporaram elementos de ${topic} na busca por maior eficiência e transparência. ` +
            `O candidato deve ser capaz de relacionar ${topic} com tendências contemporâneas de modernização da administração pública.`,
          keyPoints: [
            `${topic} se aplica na gestão pública por meio de processos e instrumentos específicos`,
            `As reformas administrativas brasileiras incorporaram elementos de ${topic}`,
            `Tendências de modernização da gestão pública estão diretamente ligadas a ${topic}`,
          ],
        },
      ];

    case 'trade':
      return [
        {
          heading: `Conceitos de ${topic}`,
          content:
            `${topic} é um tema essencial em ${disciplina}, envolvendo regras da OMC, acordos internacionais e regulamentação brasileira. ` +
            `A compreensão de ${topic} exige o domínio dos conceitos de comércio exterior e dos mecanismos de regulação do fluxo de mercadorias. ` +
            `Em ${disciplina}, ${topic} é cobrado em concursos para carreiras aduaneiras e de comércio exterior.`,
          keyPoints: [
            `${topic} envolve regras da OMC, acordos multilaterais e regulamentação brasileira`,
            `Os mecanismos de regulação do comércio exterior são fundamentais para ${topic}`,
            `Concursos para carreiras aduaneiras cobram ${topic} com profundidade em ${disciplina}`,
          ],
        },
        {
          heading: 'Regulamentação',
          content:
            `A regulamentação de ${topic} no Brasil é estabelecida pelo Regulamento Aduaneiro, normas do Mercosul e acordos internacionais. ` +
            `O candidato deve conhecer a estrutura normativa que rege ${topic}, incluindo decretos, instruções normativas e portarias da Receita Federal. ` +
            `As regras do Mercosul e os acordos preferenciais de comércio impactam diretamente a regulamentação de ${topic}.`,
          keyPoints: [
            `O Regulamento Aduaneiro e normas da Receita Federal disciplinam ${topic}`,
            `Acordos do Mercosul e tratados internacionais impactam a regulamentação de ${topic}`,
            `O candidato deve conhecer a hierarquia normativa aplicável a ${topic}`,
          ],
        },
        {
          heading: 'Operações Práticas',
          content:
            `As operações práticas envolvendo ${topic} incluem procedimentos aduaneiros, cálculos tributários e documentação. ` +
            `O candidato deve saber realizar cálculos de impostos incidentes sobre operações de ${topic}, incluindo II, IPI, PIS/COFINS-Importação e ICMS. ` +
            `O conhecimento dos procedimentos operacionais de ${topic} é essencial para cargos na área aduaneira.`,
          keyPoints: [
            `Procedimentos aduaneiros e documentação são essenciais nas operações de ${topic}`,
            `Cálculos de tributos incidentes sobre ${topic} são frequentemente cobrados em provas`,
            `O domínio operacional de ${topic} é requisito para cargos na área aduaneira`,
          ],
        },
      ];
  }
}

// ---------------------------------------------------------------------------
// Fallback lookup helpers
// ---------------------------------------------------------------------------

const FAMILY_FALLBACK_DISCIPLINE: Record<DisciplineFamily, string> = {
  legal: 'Direito Constitucional',
  accounting: 'Contabilidade Geral',
  math: 'Raciocínio Lógico',
  economics: 'Economia',
  portuguese: 'Língua Portuguesa',
  tech: 'Informática',
  admin: 'Administração Pública',
  trade: 'Comércio Internacional',
};

function lookupSources(disciplina: string, family: DisciplineFamily): Source[] {
  // 1. Exact match
  if (SOURCES[disciplina]) return SOURCES[disciplina];

  // 2. Partial match — find any key that contains or is contained by the input
  for (const key of Object.keys(SOURCES)) {
    if (disciplina.includes(key) || key.includes(disciplina)) {
      return SOURCES[key];
    }
  }

  // 3. Family fallback
  const fallback = FAMILY_FALLBACK_DISCIPLINE[family];
  if (SOURCES[fallback]) return SOURCES[fallback];

  // 4. Should never happen, but return constitutional sources as last resort
  return SOURCES['Direito Constitucional'];
}

function lookupKeyTerms(disciplina: string, family: DisciplineFamily): KeyTerm[] {
  // 1. Exact match
  if (KEY_TERMS[disciplina]) return KEY_TERMS[disciplina];

  // 2. Partial match
  for (const key of Object.keys(KEY_TERMS)) {
    if (disciplina.includes(key) || key.includes(disciplina)) {
      return KEY_TERMS[key];
    }
  }

  // 3. Family fallback
  const fallback = FAMILY_FALLBACK_DISCIPLINE[family];
  if (KEY_TERMS[fallback]) return KEY_TERMS[fallback];

  // 4. Last resort
  return KEY_TERMS['Direito Constitucional'];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getStubSummaryContent(
  topic: string,
  disciplina: string
): SummaryContent {
  const family = getDisciplineFamily(disciplina);
  const sources = lookupSources(disciplina, family);
  const keyTerms = lookupKeyTerms(disciplina, family);
  const sections = generateSections(topic, disciplina, family);

  return { sections, keyTerms, sources };
}
