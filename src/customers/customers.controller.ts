import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { FindAllCustomersDto } from './dto/find-all-customers.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { User } from '../auth/entities/user.entity'
import { ApiResponseDto } from '../common/dto/api-response.dto'

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @CurrentUser() accountant: User) {
    return this.customersService.create(createCustomerDto, accountant)
  }

  @Get()
  findAll(@CurrentUser() accountant: User, @Query() query: FindAllCustomersDto) {
    return this.customersService.findAll(accountant, query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customer = await this.customersService.findOne(id)

    return new ApiResponseDto({
      success: true,
      data: customer,
    })
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id)
  }
}
