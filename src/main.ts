import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { config } from 'dotenv'
import { AppDataSource } from './config/typeorm.config'
import { DataSource } from 'typeorm'

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
config()

async function bootstrap() {
  try {
    await (AppDataSource as DataSource).initialize()
    console.log('Data Source has been initialized!')
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error during Data Source initialization:', error.message)
    } else {
      console.error('Unknown error during Data Source initialization')
    }
    throw error
  }

  const app = await NestFactory.create(AppModule)
  const port = process.env.PORT || 3000

  await app.listen(port)
  console.log(`Application is running on: http://localhost:${port}`)
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
  process.exit(1)
})
