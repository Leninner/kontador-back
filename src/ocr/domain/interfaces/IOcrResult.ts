type OcrResultProduct = {
  name: string
  value: number
}

type OcrResultCategory =
  | 'Alimentación'
  | 'Transporte'
  | 'Equipos'
  | 'Papelería'
  | 'Alquiler'
  | 'Capacitación'
  | 'Software'
  | 'Servicios públicos'
  | 'Viáticos'
  | 'Mantenimiento'

export interface IOcrResult {
  totalValue: number
  invoiceNumber: string
  products: OcrResultProduct[]
  buyerId: string
  buyerAddress: string
  invoiceDate: string
  invoiceTime: string
  currency: string
  buyerName: string
  category: OcrResultCategory
}
