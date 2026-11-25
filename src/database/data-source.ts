import { DataSource } from 'typeorm';
import { buildTypeOrmOptions, loadDatabaseEnv } from './typeorm.options';

const env = loadDatabaseEnv();

export default new DataSource(buildTypeOrmOptions(env));
