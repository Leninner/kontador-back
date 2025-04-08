import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm'

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @CreateDateColumn()
  createdAt: Date

  @Index()
  @UpdateDateColumn()
  updatedAt: Date
}
