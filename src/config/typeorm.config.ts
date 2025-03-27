import { DataSource, DataSourceOptions } from 'typeorm'
import { config } from 'dotenv'

config()

type DatabaseConfig = {
  host: string
  port: number
  username: string
  password: string
  database: string
}

const dbConfig: DatabaseConfig = {
  host: process.env.TYPEORM_HOST || 'localhost',
  port: parseInt(process.env.TYPEORM_PORT || '5432'),
  username: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || 'postgres',
  database: process.env.TYPEORM_DATABASE || 'kontador',
}

const options: DataSourceOptions = {
  type: 'postgres',
  ...dbConfig,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: [process.env.TYPEORM_MIGRATIONS || 'dist/migrations/*{.ts,.js}'],
  migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
}

export const AppDataSource = new DataSource(options)
