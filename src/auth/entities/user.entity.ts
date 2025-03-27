import { Entity, Column, OneToMany } from 'typeorm'
import { IUser } from '../../common/interfaces/auth.interface'
import { BaseEntity } from '../../entities/base.entity'
import { Customer } from '../../customers/entities/customer.entity'

@Entity('users')
export class User extends BaseEntity implements IUser {
  @Column({ unique: true })
  email: string

  @Column()
  name: string

  @Column()
  password: string

  @OneToMany(() => Customer, (customer) => customer.accountant)
  customers: Customer[]
}
