import { Entity, Column, ManyToOne, Index } from 'typeorm'
import { User } from '../../auth/entities/user.entity'
import { BaseEntity } from '../../common/entities/base.entity'

export enum DocumentType {
  RUC = 'RUC',
  PASSPORT = 'PASSPORT',
  CI = 'CI',
  OTHER = 'OTHER',
}

@Entity('customers')
export class Customer extends BaseEntity {
  @Index()
  @Column()
  name: string

  @Index()
  @Column()
  lastName: string

  @Index()
  @Column()
  email: string

  @Index()
  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType

  @Index()
  @Column()
  documentId: string

  @Index()
  @ManyToOne(() => User, (user) => user.customers)
  accountant: User
}
