import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Column as BoardColumn } from './column.entity'
import { Comment } from './comment.entity'
import { CardHistory } from './card-history.entity'
import { Customer } from '../../customers/entities/customer.entity'

export enum CardPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('cards')
export class Card extends BaseEntity {
  @Index()
  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Index()
  @Column({ nullable: true })
  dueDate: Date

  @Column({ type: 'simple-array', nullable: true })
  labels: string[]

  @Index()
  @ManyToOne(() => BoardColumn, (column) => column.cards, { onDelete: 'CASCADE' })
  column: BoardColumn

  @Index()
  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn()
  customer: Customer

  @OneToMany(() => Comment, (comment) => comment.card, { cascade: true })
  comments: Comment[]

  @OneToMany(() => CardHistory, (history) => history.card, { cascade: true })
  history: CardHistory[]

  @Column({ default: CardPriority.MEDIUM })
  priority: CardPriority
}
