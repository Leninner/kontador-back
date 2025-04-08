import { Entity, Column, OneToMany, OneToOne, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { User } from '../../auth/entities/user.entity'
import { Column as ColumnEntity } from './column.entity'

@Entity('boards')
export class Board extends BaseEntity {
  @Index()
  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Index()
  @OneToOne(() => User)
  @JoinColumn()
  user: User

  @OneToMany(() => ColumnEntity, (column) => column.board, { cascade: true })
  columns: ColumnEntity[]
}
