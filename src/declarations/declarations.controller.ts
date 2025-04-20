import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { DeclarationsService } from './declarations.service'
import { CreateDeclarationDto } from './dto/create-declaration.dto'
import { UpdateDeclarationDto } from './dto/update-declaration.dto'
import { FindDeclarationsDto } from './dto/find-declarations.dto'
import { ApiResponseDto } from '../common/dto/api-response.dto'

@Controller('declarations')
export class DeclarationsController {
  constructor(private readonly declarationsService: DeclarationsService) {}

  @Post()
  async create(@Body() createDeclarationDto: CreateDeclarationDto) {
    const data = await this.declarationsService.create(createDeclarationDto)
    return new ApiResponseDto({ success: true, data })
  }

  @Get()
  async findAll(@Query() findDeclarationsDto: FindDeclarationsDto) {
    const result = await this.declarationsService.findAll(findDeclarationsDto)
    return new ApiResponseDto({
      success: true,
      data: result.data,
      meta: result.meta,
    })
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.declarationsService.findOne(id)
    return new ApiResponseDto({ success: true, data })
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDeclarationDto: UpdateDeclarationDto) {
    const data = await this.declarationsService.update(id, updateDeclarationDto)
    return new ApiResponseDto({ success: true, data })
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.declarationsService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
