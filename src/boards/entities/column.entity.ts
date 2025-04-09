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

  @TypeOrmColumn({ default: false })
  sendEmailOnCardEntry: boolean

  @TypeOrmColumn({ nullable: true })
  emailTemplateName: string

  @TypeOrmColumn({ nullable: true, type: 'jsonb' })
  emailConfig: {
    subject?: string
    customMessage?: string
    useSendgrid?: boolean
    sendgridTemplateId?: string
  }

  @Index()
  @ManyToOne(() => Board, (board) => board.columns, { onDelete: 'CASCADE' })
  board: Board

  @OneToMany(() => Card, (card) => card.column, { cascade: true })
  cards: Card[]
}
