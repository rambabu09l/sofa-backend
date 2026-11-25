import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Env } from '../config/env.schema';
import { validateEnv } from '../config/env.validation';

const rootDir = join(__dirname, '..', '..');
const envLocalPath = join(rootDir, '.env.local');
const envPath = join(rootDir, '.env');
// Local CLI (migration:*) often only has .env.local; Nest boot may already have env.
if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath, override: false });
}
if (existsSync(envPath)) {
  loadEnv({ path: envPath, override: false });
}
loadEnv({ override: false });

export type MysqlRuntimeConfig = Pick<
  Env,
  | 'NODE_ENV'
  | 'MYSQL_HOST'
  | 'MYSQL_PORT'
  | 'MYSQL_USER'
  | 'MYSQL_PASSWORD'
  | 'MYSQL_DATABASE'
  | 'MYSQL_SYNC'
  | 'MYSQL_LOGGING'
  | 'MYSQL_POOL_SIZE'
  | 'MYSQL_CONNECT_TIMEOUT_MS'
  | 'MYSQL_SSL'
  | 'MYSQL_SSL_REJECT_UNAUTHORIZED'
>;

export function loadDatabaseEnv(): Env {
  return validateEnv(process.env);
}

export function buildTypeOrmOptions(
  env: MysqlRuntimeConfig,
): DataSourceOptions {
  const isProduction = env.NODE_ENV === 'production';

  return {
    type: 'mysql',
    host: env.MYSQL_HOST === 'localhost' ? '127.0.0.1' : env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    username: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    charset: 'utf8mb4',
    timezone: 'Z',
    synchronize: env.MYSQL_SYNC && !isProduction,
    logging: env.MYSQL_LOGGING,
    namingStrategy: new SnakeNamingStrategy(),
    entities: [
      join(__dirname, '..', '**', '*.entity.js'),
      join(__dirname, '..', '**', '*.entity.ts'),
    ],
    migrations: [join(__dirname, 'migrations/*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
    extra: {
      connectionLimit: env.MYSQL_POOL_SIZE,
      connectTimeout: env.MYSQL_CONNECT_TIMEOUT_MS,
    },
    ssl: env.MYSQL_SSL
      ? { rejectUnauthorized: env.MYSQL_SSL_REJECT_UNAUTHORIZED }
      : undefined,
  };
}
