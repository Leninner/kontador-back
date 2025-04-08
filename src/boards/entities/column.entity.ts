import { Entity, Column as TypeOrmColumn, ManyToOne, OneToMany, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Board } from './board.entity'
import { Card } from './card.entity'

@Entity('columns')
export class Column extends BaseEntity {
  @Index()
  @TypeOrmColumn()
  name: string

  @TypeOrmColumn({ nullable: true })
  description: string

  @Index()
  @TypeOrmColumn({ default: 0 })
  order: number

  @Index()
  @ManyToOne(() => Board, (board) => board.columns, { onDelete: 'CASCADE' })
  board: Board

  @OneToMany(() => Card, (card) => card.column, { cascade: true })
  cards: Card[]
}
