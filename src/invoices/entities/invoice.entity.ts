import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Customer } from '../../customers/entities/customer.entity'

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column()
  customerId: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer

  @Column()
  number: string

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tax: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  iva: number
}
