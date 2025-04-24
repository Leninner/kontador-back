import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EmailService } from './email.service'
import { SendGridAdapter } from './sendgrid.adapter'
import { TemplateService } from './template.service'
import { TemplateValidatorService } from './template-validator.service'

@Module({
  imports: [ConfigModule],
  providers: [SendGridAdapter, EmailService, TemplateService, TemplateValidatorService],
  exports: [EmailService, TemplateService, TemplateValidatorService],
})
export class EmailModule {}
