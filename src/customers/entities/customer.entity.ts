import { Entity, Column, ManyToOne, DeleteDateColumn } from 'typeorm'
import { User } from '../../auth/entities/user.entity'
import { BaseEntity } from '../../entities/base.entity'

export enum DocumentType {
  DNI = 'DNI',
  RUC = 'RUC',
  CE = 'CE',
  PASSPORT = 'PASSPORT',
}

@Entity('customers')
export class Customer extends BaseEntity {
  @Column()
  name: string

  @Column()
  lastName: string

  @Column()
  email: string

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType

  @Column({ unique: true })
  documentId: string

  @ManyToOne(() => User, (user) => user.customers)
  accountant: User

  @DeleteDateColumn()
  deletedAt: Date
}
