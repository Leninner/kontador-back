import { Entity, Column, ManyToOne, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Card } from './card.entity'
import { User } from '../../auth/entities/user.entity'

export enum HistoryActionType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  MOVED = 'MOVED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  CUSTOMER_LINKED = 'CUSTOMER_LINKED',
  CUSTOMER_UNLINKED = 'CUSTOMER_UNLINKED',
  DUE_DATE_CHANGED = 'DUE_DATE_CHANGED',
  COMMENT_DELETED = 'COMMENT_DELETED',
}

@Entity('card_history')
export class CardHistory extends BaseEntity {
  @Index()
  @Column({
    type: 'enum',
    enum: HistoryActionType,
  })
  action: HistoryActionType

  @Column({ type: 'json', nullable: true })
  changes: Record<string, any>

  @Column({ nullable: true })
  description: string

  @Index()
  @ManyToOne(() => Card, (card) => card.history, { onDelete: 'CASCADE' })
  card: Card

  @Index()
  @ManyToOne(() => User)
  user: User
}
