export interface Frontmatter {
  topic: string;
  disciplina: string;
  topico: string;
  professorName: string;
}

export interface SummaryBody {
  sections: { heading: string; content: string; keyPoints: string[] }[];
  keyTerms: { term: string; definition: string }[];
  sources: { title: string; author?: string; type: string }[];
}

export interface FlashcardBody {
  cards: { front: string; back: string; hint?: string }[];
}

export interface QuizBody {
  questions: {
    id: string;
    question: string;
    alternatives: { label: string; text: string }[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export interface ParsedMarkdown<T> {
  title: string;
  body: T;
  frontmatter: Frontmatter;
}

function parseFrontmatter(md: string): { frontmatter: Frontmatter; body: string } {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('Missing frontmatter delimiters');
  const yaml = match[1];
  const body = match[2];
  const fm: Record<string, string> = {};
  for (const line of yaml.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*"?(.*?)"?\s*$/);
    if (!kv) continue;
    fm[kv[1]] = kv[2];
  }
  for (const key of ['topic', 'disciplina', 'topico', 'professorName']) {
    if (!fm[key]) throw new Error(`Frontmatter missing field: ${key}`);
  }
  return {
    frontmatter: {
      topic: fm.topic,
      disciplina: fm.disciplina,
      topico: fm.topico,
      professorName: fm.professorName,
    },
    body,
  };
}

function stripHtmlComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

export function parseResumo(md: string): ParsedMarkdown<SummaryBody> {
  const { frontmatter, body } = parseFrontmatter(md);
  const cleaned = stripHtmlComments(body);

  const sections: SummaryBody['sections'] = [];
  const keyTerms: SummaryBody['keyTerms'] = [];
  const sources: SummaryBody['sources'] = [];

  const chunks = cleaned.split(/^## /m).slice(1);
  for (const chunk of chunks) {
    const nl = chunk.indexOf('\n');
    const heading = chunk.slice(0, nl === -1 ? chunk.length : nl).trim();
    const rest = (nl === -1 ? '' : chunk.slice(nl + 1)).trim();

    if (/^Termos[-\s]Chave$/i.test(heading)) {
      for (const line of rest.split(/\r?\n/)) {
        const m = line.match(/^-\s*\*\*(.+?)\*\*:\s*(.+)$/);
        if (m) keyTerms.push({ term: m[1].trim(), definition: m[2].trim() });
      }
      continue;
    }
    if (/^Fontes$/i.test(heading)) {
      for (const line of rest.split(/\r?\n/)) {
        const m = line.match(/^-\s*(.+)$/);
        if (!m) continue;
        const parts = m[1].split('|').map((p) => p.trim());
        const [title, author, type] = [parts[0] ?? '', parts[1] ?? '', parts[2] ?? ''];
        if (!title) continue;
        sources.push({
          title,
          author: author || undefined,
          type: type || 'referência',
        });
      }
      continue;
    }

    const lines = rest.split(/\r?\n/);
    const contentLines: string[] = [];
    const keyPoints: string[] = [];
    for (const line of lines) {
      const kp = line.match(/^-\s*\*\*Ponto-chave:\*\*\s*(.+)$/);
      if (kp) {
        keyPoints.push(kp[1].trim());
      } else {
        contentLines.push(line);
      }
    }
    sections.push({
      heading,
      content: contentLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
      keyPoints,
    });
  }

  if (sections.length === 0) throw new Error('Resumo parser: no sections found');

  return {
    title: `Resumo: ${frontmatter.topic}`,
    body: { sections, keyTerms, sources },
    frontmatter,
  };
}

export function parseFlashcards(md: string): ParsedMarkdown<FlashcardBody> {
  const { frontmatter, body } = parseFrontmatter(md);
  const cleaned = stripHtmlComments(body);

  const chunks = cleaned.split(/^###\s+Card\s*$/m).slice(1);
  const cards: FlashcardBody['cards'] = [];

  for (const chunk of chunks) {
    const frontMatch = chunk.match(/\*\*Frente:\*\*\s*([\s\S]*?)\n\s*\n\s*\*\*Verso:\*\*/);
    const backMatch = chunk.match(/\*\*Verso:\*\*\s*([\s\S]*?)(?=\n\s*\n\s*\*\*Dica:\*\*|\n\s*---\s*\n|$)/);
    const hintMatch = chunk.match(/\*\*Dica:\*\*\s*([\s\S]*?)(?=\n\s*---\s*\n|$)/);
    if (!frontMatch || !backMatch) continue;

    const front = frontMatch[1].trim();
    const back = backMatch[1].trim();
    const hint = hintMatch?.[1].trim();

    cards.push(hint ? { front, back, hint } : { front, back });
  }

  if (cards.length === 0) throw new Error('Flashcard parser: no cards found');

  return {
    title: `Flashcards: ${frontmatter.topic}`,
    body: { cards },
    frontmatter,
  };
}

export function parseQuiz(md: string): ParsedMarkdown<QuizBody> {
  const { frontmatter, body } = parseFrontmatter(md);
  const cleaned = stripHtmlComments(body);

  const re = /###\s+Q(\d+)\s*\n([\s\S]*?)(?=\n###\s+Q\d+\s*\n|\n*$)/g;
  const questions: QuizBody['questions'] = [];

  let match: RegExpExecArray | null;
  while ((match = re.exec(cleaned)) !== null) {
    const num = match[1];
    const block = match[2];

    const altsStartIdx = block.search(/^-\s*\(/m);
    if (altsStartIdx === -1) continue;

    const statement = block.slice(0, altsStartIdx).trim();
    const rest = block.slice(altsStartIdx);

    const respostaIdx = rest.search(/^\*\*Resposta:\*\*/m);
    if (respostaIdx === -1) continue;

    const altsText = rest.slice(0, respostaIdx);
    const afterResposta = rest.slice(respostaIdx);

    const alternatives: { label: string; text: string }[] = [];
    for (const line of altsText.split(/\r?\n/)) {
      const m = line.match(/^-\s*\(([A-E])\)\s*(.+)$/);
      if (m) alternatives.push({ label: m[1], text: m[2].trim() });
    }

    const correctMatch = afterResposta.match(/^\*\*Resposta:\*\*\s*([A-E])/m);
    const explMatch = afterResposta.match(/\*\*Explicação:\*\*\s*([\s\S]*?)(?=\n\s*---\s*\n|$)/);

    if (!correctMatch || !explMatch) continue;

    questions.push({
      id: `q${num}`,
      question: statement,
      alternatives,
      correctAnswer: correctMatch[1],
      explanation: explMatch[1].trim(),
    });
  }

  if (questions.length === 0) throw new Error('Quiz parser: no questions found');

  return {
    title: `Quiz: ${frontmatter.topic}`,
    body: { questions },
    frontmatter,
  };
}
