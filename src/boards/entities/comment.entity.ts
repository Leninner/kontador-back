import { Entity, Column, ManyToOne, Index } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { Card } from './card.entity'
import { User } from '../../auth/entities/user.entity'

@Entity('comments')
export class Comment extends BaseEntity {
  @Column()
  content: string

  @Index()
  @ManyToOne(() => Card, (card) => card.comments, { onDelete: 'CASCADE' })
  card: Card

  @Index()
  @ManyToOne(() => User)
  user: User
}
