import OpenAI from 'openai'
import { OcrRepository } from '../../domain/OcrRepository'
import { extractFieldsFromInvoiceTool } from './tools/ExtractFieldsFromInvoice'
import { Injectable } from '@nestjs/common'

@Injectable()
export class OpenAiOcrRepository extends OcrRepository {
  private readonly client: OpenAI

  constructor() {
    super()
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async extractTextFromImage(data: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a specialized OCR assistant that extracts structured information from invoices.
                    Your only task is to read the invoice image and extract all relevant fields accurately.
                    Extract vendor information, dates, line items, totals, tax information, and any other relevant data.
                    Be precise with numbers, amounts, and dates. Format currency values consistently.
                    DO NOT include any explanations or additional text. Respond ONLY with the JSON structure from the extraction tool.
                    If you can't find the information, return an empty object.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all information from this invoice and return it as structured data. Include vendor details, invoice number, date, due date, line items, subtotals, taxes, and total amount.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${data}`,
              },
            },
          ],
        },
      ],
      tools: [extractFieldsFromInvoiceTool()],
      tool_choice: { type: 'function', function: { name: 'extract_fields_from_invoice' } },
    })

    const content = response.choices[0].message.tool_calls?.[0]?.function.arguments

    if (!content) {
      throw new Error('No content found')
    }

    return content
  }
}
