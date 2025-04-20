import { Module } from '@nestjs/common'
import { PaginationModule } from './pagination.module'

@Module({
  imports: [PaginationModule],
  exports: [PaginationModule],
})
export class CommonModule {}
