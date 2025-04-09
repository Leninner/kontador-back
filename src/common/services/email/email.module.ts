import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EmailService } from './email.service'
import { SendGridAdapter } from './sendgrid.adapter'
import { TemplateService } from './template.service'

@Module({
  imports: [ConfigModule],
  providers: [SendGridAdapter, EmailService, TemplateService],
  exports: [EmailService, TemplateService],
})
export class EmailModule {}
