import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { IOcrResult } from '../../../ocr/domain/interfaces/IOcrResult'
import { WhatsappRepository } from '../../domain/WhatsappRepository'
import { ProcessImageMessage as ProcesMessage } from '../services/ProcessImageMessage'
import { InvoicesService } from '../../../invoices/invoices.service'
import { CreateInvoiceDto } from '../../../invoices/dto/create-invoice.dto'
import { CustomersService } from '../../../customers/customers.service'
import { Customer, DocumentType } from '../../../customers/entities/customer.entity'
import { WhatsappTaskService } from '../../../boards/services/whatsapp-task.service'
import { CardPriority } from '../../../boards/entities/card.entity'
import { User } from '../../../auth/entities/user.entity'
import { UserService } from '../../../auth/services/user.service'
import * as Sentry from '@sentry/node'
import { ICreateTaskIntent } from '../../domain/interfaces/IUserIntent'

@Injectable()
export class ProcessIncomingMessage {
  private readonly MESSAGES = {
    WELCOME: `*¡Hola y bienvenido!* 👋 \nSoy tu *asistente virtual* para la gestión de gastos empresariales. 📋✨
      \n📸 *Sube una foto* de tu recibo o factura y yo me encargaré de procesarlo rápidamente.
      \nPuedes también crear tareas escribiendo "TAREA:" seguido del nombre de la tarea.`,
    SAVE_RECEIPT: 'Ok, vamos a guardar tu factura, esto puede tardar unos segundos.',
    TRY_AGAIN: 'Ok, no hay problema, puedes subir otra imagen o escribir "HOLA" para reiniciar el proceso.',
    NOT_UNDERSTOOD:
      'No entiendo lo que me estás diciendo, puedes subir una imagen o escribir "HOLA" para reiniciar el proceso.',
    ANALYZING_RECEIPT: 'Analizando tu recibo, esto puede tardar unos segundos...',
    SAVED_RECEIPT: 'Factura guardada correctamente. 🎉',
    ERROR_SAVING_RECEIPT: 'Hubo un error al guardar la factura, por favor intenta de nuevo.',
    TASK_CREATED: 'Tarea creada correctamente. 🎯',
    TASK_ERROR: 'Hubo un error al crear la tarea, por favor verifica los datos e intenta de nuevo.',
    TASK_HELP: `Para crear una tarea necesito algo más de información. Usa este formato:
      \nTAREA: Nombre de la tarea
      \nDESC: Descripción opcional
      \nFECHA: DD/MM/YYYY (opcional)
      \nPRIORIDAD: ALTA/MEDIA/BAJA (opcional, por defecto MEDIA)
      \nCOLUMNA: ID de la columna (obligatorio)
      \nCLIENTE: ID del cliente (opcional)`,
    ERROR_CREATING_TASK: 'Hubo un error al crear la tarea, por favor verifica los datos e intenta de nuevo.',
  }

  private lastOcrResults = new Map<string, IOcrResult>()
  private accountantCache = new Map<string, User>()

  constructor(
    @Inject(forwardRef(() => ProcesMessage))
    private readonly processMessage: ProcesMessage,

    @Inject(forwardRef(() => WhatsappRepository))
    private readonly whatsappRepository: WhatsappRepository,
    private readonly invoicesService: InvoicesService,
    private readonly customersService: CustomersService,
    private readonly whatsappTaskService: WhatsappTaskService,
    private readonly userService: UserService,
  ) {}

  async run(params: { from: string; to: string; message: string; mediaUrl?: string }): Promise<{ message: string }> {
    const { from, message, mediaUrl } = params
    const phone = this.removeWhatsappPrefix(from)
    const upperMessage = message.toUpperCase()

    if (upperMessage === 'HOLA') {
      return this.sendMessage(phone, this.MESSAGES.WELCOME)
    }

    if (mediaUrl) {
      await this.sendMessage(phone, this.MESSAGES.ANALYZING_RECEIPT)
      const ocrResult = await this.processMessage.run({ imageUrl: mediaUrl, message })
      this.lastOcrResults.set(phone, ocrResult as IOcrResult)
      return this.sendMessage(phone, this.formatReceiptDetails(ocrResult as IOcrResult))
    }

    if (upperMessage === 'SI') {
      const ocrResult = this.lastOcrResults.get(phone)

      if (ocrResult) {
        await this.createInvoice(ocrResult, phone)
        return this.sendMessage(phone, this.MESSAGES.SAVED_RECEIPT)
      }
    }

    const result = await this.processMessage.run({
      message,
    })
    console.log('result', result)

    return this.handleCreateTaskIntent(phone, result as ICreateTaskIntent)
  }

  private removeWhatsappPrefix(phone: string): string {
    return phone.replace('whatsapp:+', '')
  }

  private async sendMessage(to: string, message: string): Promise<{ message: string }> {
    await this.whatsappRepository.sendMessage({ to, message })
    return { message: 'Message sent' }
  }

  private formatReceiptDetails(text: IOcrResult): string {
    return `
      Acabamos de analizar tu imagen y hemos detectado la siguiente información:

      - *Número de Factura:* ${text.invoiceNumber}
      - *Valor Total:* ${text.totalValue} ${text.currency}
      - *Productos:*
      ${this.formatProducts(text.products, text.currency)}
      - *NIT o ID del Comprador:* ${text.buyerId}
      - *Dirección del Comprador:* ${text.buyerAddress || 'No disponible'}
      - *Fecha de la Factura:* ${text.invoiceDate}
      - *Hora de la Factura:* ${text.invoiceTime}
      - *Nombre del Comprador:* ${text.buyerName || 'No disponible'}
      - *Categoría:* ${text.category}\n

    Es correcto? (Si/No) 🤔
    `.trim()
  }

  private formatProducts(
    products: Record<string, string | number | null | undefined>[] | undefined,
    currency: string,
  ): string {
    return products?.map((product) => `  - ${product.name}: ${product.value} ${currency}`).join('\n') ?? ''
  }

  private async findOrCreateCustomer(ocrResult: IOcrResult, phone: string): Promise<Customer> {
    const existingCustomer = await this.customersService.findByDocumentId(ocrResult.buyerId)

    if (existingCustomer) {
      return existingCustomer
    }

    const accountant = await this.getAccountantByPhone(phone)

    const names = ocrResult.buyerName?.split(' ') || ['Cliente', 'Nuevo']
    const firstName = names[0]
    const lastName = names.length > 1 ? names.slice(1).join(' ') : 'Sin apellido'

    const customerData = {
      name: firstName,
      lastName: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s/g, '')}@example.com`,
      documentType: DocumentType.RUC,
      documentId: ocrResult.buyerId,
    }

    return await this.customersService.create(customerData, accountant)
  }

  private async createInvoice(ocrResult: IOcrResult, phone: string) {
    try {
      const dateParts = ocrResult.invoiceDate.split('/')

      let formattedDate = new Date()
      try {
        formattedDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
      } catch (error) {
        Sentry.captureException(error)
      }

      const customer = await this.findOrCreateCustomer(ocrResult, phone)

      const createInvoiceDto: CreateInvoiceDto = {
        customerId: customer.id,
        number: ocrResult.invoiceNumber,
        date: formattedDate.toISOString(),
        amount: ocrResult.totalValue,
        tax: 0,
        iva: 0,
      }

      const invoice = await this.invoicesService.create(createInvoiceDto)
      return invoice
    } catch (error) {
      Sentry.captureException(error)
    }
  }

  private async handleCreateTaskIntent(phone: string, intent: ICreateTaskIntent): Promise<{ message: string }> {
    try {
      const { task_name, description, due_date, priority, customer_id } = intent

      if (!task_name) {
        return this.sendMessage(phone, 'Para crear una tarea necesito al menos el nombre y la columna de la tarea.')
      }
      console.log('priority from main', priority)

      const accountant = await this.getAccountantByPhone(phone)
      const customer = await this.customersService.findByDocumentId(customer_id || '')

      const formattedDueDate = due_date ? new Date(due_date) : undefined

      const taskInput = {
        name: task_name,
        description,
        dueDate: formattedDueDate?.toISOString() || undefined,
        priority: this.mapPriority(priority),
        customerId: customer?.id || undefined,
        createdBy: accountant,
      }

      await this.whatsappTaskService.createTask(taskInput)

      return this.sendMessage(phone, this.MESSAGES.TASK_CREATED)
    } catch (error) {
      Sentry.captureException(error)
      return this.sendMessage(phone, this.MESSAGES.TASK_ERROR)
    }
  }

  private mapPriority(priority?: string): CardPriority | undefined {
    if (!priority) return CardPriority.MEDIUM

    switch (priority) {
      case 'ALTA':
        return CardPriority.HIGH
      case 'MEDIA':
        return CardPriority.MEDIUM
      case 'BAJA':
        return CardPriority.LOW
      default:
        return CardPriority.MEDIUM
    }
  }

  /**
   * Find the accountant user based on phone number
   * Uses caching to avoid repeated database queries
   */
  private async getAccountantByPhone(phone: string): Promise<User> {
    if (this.accountantCache.has(phone)) {
      return this.accountantCache.get(phone)!
    }

    let accountant: User | null = null

    accountant = await this.userService.findByPhone(phone)

    if (!accountant) {
      throw new Error('No accountant found and no default configured')
    }

    this.accountantCache.set(phone, accountant)
    return accountant
  }
}
