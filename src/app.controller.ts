import { Controller, Get, Post, Body } from '@nestjs/common'
import { AppService } from './app.service'
import { ProcessWebhookService } from './ocr/infrastructure/services/ProcessWebhookService'
import { IWhatsappWebhook } from './whatsapp/domain/interfaces/IWhatsappWebhook'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly processWebhookService: ProcessWebhookService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Post('webhook')
  processWebhook(@Body() body: IWhatsappWebhook) {
    return this.processWebhookService.process(body)
  }
}
