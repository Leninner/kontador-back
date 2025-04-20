# Common Pagination Module

This module provides reusable pagination components for any entity in your application.

## Components

1. **PaginationService**: Utility class with static methods for paginating data.
2. **BasePaginationService**: Base class that services can extend for easy pagination.
3. **BasePaginationController**: Base class that controllers can extend.
4. **BaseFilterDto**: Base DTO with pagination and filtering parameters.

## How to Use

### 1. Import the Common Module

In your feature module:

```typescript
import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  // ...
})
export class YourFeatureModule {}
```

### 2. Extend the Base DTOs

Create your feature-specific DTO extending the BaseFilterDto:

```typescript
import { IsOptional, IsString } from 'class-validator';
import { BaseFilterDto } from '../common/dto/base-filter.dto';

export class FindAllItemsDto extends BaseFilterDto {
  @IsOptional()
  @IsString()
  name?: string;
  
  // Add other specific filters...
}
```

### 3. Extend the Base Service

Make your service extend the BasePaginationService:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasePaginationService } from '../common/services/base-pagination.service';
import { YourEntity } from './entities/your-entity.entity';

@Injectable()
export class YourService extends BasePaginationService<YourEntity> {
  constructor(
    @InjectRepository(YourEntity)
    private readonly yourRepository: Repository<YourEntity>,
  ) {
    super(yourRepository);
  }
  
  async findAll(filterDto: FindAllItemsDto) {
    // Option 1: Use the query builder approach
    const queryBuilder = this.createBaseQueryBuilder('item', [
      { property: 'relation', alias: 'relationAlias' }
    ]);
    
    // Add your conditions
    if (filterDto.name) {
      queryBuilder.andWhere('item.name ILIKE :name', { name: `%${filterDto.name}%` });
    }
    
    // Apply sorting if needed
    if (filterDto.sortBy) {
      queryBuilder.orderBy(`item.${filterDto.sortBy}`, filterDto.sortOrder || 'ASC');
    } else {
      queryBuilder.orderBy('item.createdAt', 'DESC');
    }
    
    return this.findAllWithQueryBuilder(queryBuilder, filterDto);
    
    // Option 2: Use the repository approach with where conditions
    /*
    const where = {};
    if (filterDto.name) {
      where.name = Like(`%${filterDto.name}%`);
    }
    
    const order = {};
    if (filterDto.sortBy) {
      order[filterDto.sortBy] = filterDto.sortOrder || 'ASC';
    } else {
      order.createdAt = 'DESC';
    }
    
    return this.findAllWithPagination(filterDto, where, order);
    */
  }
}
```

### 4. Use in Controller (optional)

You can also extend the BasePaginationController if you need its methods directly:

```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { YourService } from './your.service';
import { FindAllItemsDto } from './dto/find-all-items.dto';
import { BasePaginationController } from '../common/controllers/base-pagination.controller';
import { YourEntity } from './entities/your-entity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class YourController extends BasePaginationController<YourEntity> {
  constructor(
    private readonly yourService: YourService,
    @InjectRepository(YourEntity)
    private readonly yourRepository: Repository<YourEntity>,
  ) {
    super(yourRepository);
  }

  @Get()
  findAll(@Query() query: FindAllItemsDto) {
    return this.yourService.findAll(query);
  }
}
```

## Benefits

- Consistent pagination across the application
- Reduced code duplication
- Type-safe implementation
- Support for both repository and query builder approaches
- Built-in meta information (total, pages, etc.)
- Consistent API response structure 