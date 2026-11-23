import { mkdirSync } from 'node:fs';
import { PrismaClient } from '../../generated/prisma/client.ts';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

export const connectDatabase = (url = process.env.DATABASE_URL ?? 'file:./data/path-finder.db') => {
  mkdirSync('data', { recursive: true });
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
};
