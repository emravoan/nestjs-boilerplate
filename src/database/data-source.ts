import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

/**
 * Loads environment variables for TypeORM CLI outside Nest runtime.
 */
loadEnv();

/**
 * Builds database options for migration commands.
 */
const dataSourceOptions: MysqlConnectionOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nestjs_boilerplate',
  /**
   * Never use synchronize with migration-driven schema management.
   */
  synchronize: false,
  /**
   * Supports entity discovery in both ts-node and compiled dist runtime.
   */
  entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
  /**
   * Stores migration files under src/database/migrations and dist equivalent.
   */
  migrations: ['src/database/migrations/*.ts', 'dist/database/migrations/*.js'],
};

export default new DataSource(dataSourceOptions);
