declare module 'pdf-parse' {
  interface PdfData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    version: string;
    text: string;
  }

  function pdf(dataBuffer: Buffer | ArrayBuffer): Promise<PdfData>;
  export = pdf;
}

// Internal entry point imported directly by services/pdf-extract.ts (skips the
// package's import-time debug harness and is interceptable by vi.mock).
declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    version: string;
    text: string;
  }

  function pdf(dataBuffer: Buffer | ArrayBuffer): Promise<PdfData>;
  export = pdf;
}
