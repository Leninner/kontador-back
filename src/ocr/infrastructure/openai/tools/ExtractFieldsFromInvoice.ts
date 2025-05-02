import { ChatCompletionTool } from 'openai/resources'

const categories = [
  'Alimentación',
  'Transporte',
  'Equipos',
  'Papelería',
  'Alquiler',
  'Capacitación',
  'Software',
  'Servicios públicos',
  'Viáticos',
  'Mantenimiento',
]

export const extractFieldsFromInvoiceTool = (): ChatCompletionTool => {
  return {
    type: 'function',
    function: {
      name: 'extract_fields_from_invoice',
      description: 'Extract fields from the image of an invoice',
      parameters: {
        type: 'object',
        properties: {
          totalValue: {
            type: 'integer',
            description: 'The total value of the invoice',
          },
          invoiceNumber: {
            type: 'string',
            description: 'The number of the invoice',
          },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                value: { type: 'integer' },
              },
              required: ['name', 'value'],
              additionalProperties: false,
            },
          },
          buyerId: {
            type: 'string',
            description: 'The id of the buyer',
          },
          buyerAddress: {
            type: 'string',
            description: 'The address of the buyer',
          },
          invoiceDate: {
            type: 'string',
            description: 'The date of the invoice in format YYYY-MM-DD',
          },
          invoiceTime: {
            type: 'string',
            description: 'The time of the invoice in format HH:MM',
          },
          currency: {
            type: 'string',
            description: 'The currency of the invoice in format USD, COP, EUR, etc.',
          },
          buyerName: {
            type: 'string',
            description: 'The name of the buyer',
          },
          category: {
            type: 'string',
            description: 'The category of the invoice',
            enum: categories,
          },
        },
        required: [
          'totalValue',
          'invoiceNumber',
          'buyerId',
          'buyerAddress',
          'invoiceDate',
          'invoiceTime',
          'currency',
          'buyerName',
          'category',
          'products',
        ],
        additionalProperties: false,
      },
      strict: true,
    },
  }
}
