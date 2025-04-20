import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DeclarationsController } from './declarations.controller'
import { DeclarationsService } from './declarations.service'
import { Declaration } from './entities/declaration.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Declaration])],
  controllers: [DeclarationsController],
  providers: [DeclarationsService],
  exports: [DeclarationsService],
})
export class DeclarationsModule {}
