import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Customer } from '../../customers/entities/customer.entity'

@Entity('declarations')
export class Declaration extends BaseEntity {
  @Column()
  customerId: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer

  @Column()
  formType: string

  @Column()
  period: string

  @Column()
  status: string

  @Column({ nullable: true })
  submittedDate: Date

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalIncome: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalExpenses: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTax: number

  @Column({ nullable: true })
  documentUrl: string
}
