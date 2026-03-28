import { building } from '$app/environment';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// SvelteKit postbuild analyse imports server modules without env; postgres-js はクエリまで接続しない
const databaseUrl =
	process.env.DATABASE_URL ??
	(building ? 'postgresql://build:build@127.0.0.1:5432/build' : undefined);

if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const client = postgres(databaseUrl, { prepare: false });

export const db = drizzle(client, { schema });
