import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import * as Handlebars from 'handlebars'

/**
 * Servicio para gestionar plantillas de correo electrónico utilizando Handlebars
 */
@Injectable()
export class TemplateService {
  private readonly templateCache: Map<string, Handlebars.TemplateDelegate> = new Map()
  private readonly templatesDir: string

  constructor() {
    // Ruta base de las plantillas
    this.templatesDir = path.join(process.cwd(), 'src', 'common', 'templates', 'emails')
  }

  /**
   * Compila una plantilla y la guarda en caché
   */
  private compileTemplate(templateName: string): Handlebars.TemplateDelegate {
    // Verificar si la plantilla ya está en caché
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName) as Handlebars.TemplateDelegate
    }

    // Leer la plantilla del sistema de archivos
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`)

    try {
      const templateContent = fs.readFileSync(templatePath, 'utf-8')

      // Check if template is empty
      if (!templateContent || templateContent.trim() === '') {
        throw new Error(`Template file exists but is empty: ${templateName}`)
      }

      const compiledTemplate = Handlebars.compile(templateContent)

      // Guardar en caché para futuras solicitudes
      this.templateCache.set(templateName, compiledTemplate)

      return compiledTemplate
    } catch (error) {
      throw new Error(`Error loading email template "${templateName}": ${error.message}`)
    }
  }

  /**
   * Renderiza una plantilla con los datos proporcionados
   */
  render(templateName: string, data: Record<string, any> = {}): string {
    try {
      const template = this.compileTemplate(templateName)
      const renderedContent = template(data)

      // Verify that rendered content is not empty
      if (!renderedContent || renderedContent.trim() === '') {
        console.warn(`Template ${templateName} rendered empty content, using fallback`)
        return this.renderFallbackTemplate(data)
      }

      return renderedContent
    } catch (error) {
      // Si no podemos cargar la plantilla, devolvemos un mensaje de error
      console.error(`Failed to render template ${templateName}:`, error)

      // Si está en desarrollo, mostrar detalles del error
      if (process.env.NODE_ENV === 'development') {
        return `
          <div style="color: red; padding: 20px; border: 1px solid red;">
            <h2>Template Error: ${templateName}</h2>
            <p>${error.message}</p>
            <pre>${error.stack}</pre>
          </div>
        `
      }

      // En producción, usar una plantilla de respaldo genérica
      return this.renderFallbackTemplate(data)
    }
  }

  /**
   * Plantilla de respaldo genérica en caso de error
   */
  private renderFallbackTemplate(data: Record<string, any>): string {
    const customerName = data.customer?.name || data.customerName || 'Estimado cliente'
    const cardName = data.card?.name || data.cardName || 'su solicitud'
    const columnName = data.newColumn?.name || data.columnName || 'una nueva etapa'

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <p>Hola ${customerName},</p>
        <p>Le informamos que ${cardName} ha sido movida a ${columnName}.</p>
        <p>Para más información, contacte a su contador.</p>
        <p>Saludos cordiales,<br>Equipo de Kontador</p>
      </div>
    `
  }
}
