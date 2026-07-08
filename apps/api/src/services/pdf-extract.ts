// Import the internal entry point directly. The package's index.js runs a
// debug harness on import that reads a local test PDF from disk (only active
// when required as the main module), and — more importantly — importing the
// internal module lets vi.mock intercept it in tests. This entry is a plain
// CommonJS module exporting the parser function.
import pdf from 'pdf-parse/lib/pdf-parse.js';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}
