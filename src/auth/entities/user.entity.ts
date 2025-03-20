import { Entity, Column } from 'typeorm'
import { IUser } from '../../common/interfaces/auth.interface'
import { BaseEntity } from '../../entities/base.entity'

@Entity('users')
export class User extends BaseEntity implements IUser {
  @Column({ unique: true })
  email: string

  @Column()
  name: string

  @Column()
  password: string
}
