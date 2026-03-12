import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Ensure .env is loaded from apps/api/ regardless of CWD
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  ssl: connectionString.includes('supabase.co') ? 'require' : false,
});
export const db = drizzle(client, { schema });
