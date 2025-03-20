import { DataSource, DataSourceOptions } from 'typeorm'
import { config } from 'dotenv'
import { User } from '../entities/user.entity'

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
  entities: [User],
  migrations: [process.env.TYPEORM_MIGRATIONS || 'dist/migrations/*{.ts,.js}'],
  migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
export const AppDataSource = new DataSource(options)
