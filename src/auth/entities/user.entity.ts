import { Entity, Column, OneToMany, OneToOne, Index } from 'typeorm'
import { IUser } from '../../common/interfaces/auth.interface'
import { BaseEntity } from '../../common/entities/base.entity'
import { Customer } from '../../customers/entities/customer.entity'
import { Board } from '../../boards/entities/board.entity'

@Entity('users')
export class User extends BaseEntity implements IUser {
  @Index()
  @Column({ unique: true })
  email: string

  @Index()
  @Column()
  name: string

  @Column()
  password: string

  @OneToMany(() => Customer, (customer) => customer.accountant)
  customers: Customer[]

  @OneToOne(() => Board, (board) => board.user)
  board: Board
}
