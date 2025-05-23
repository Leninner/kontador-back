import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { ApiResponseDto } from '../../common/dto/api-response.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find a user by their phone number
   * @param phone The phone number to search for
   * @returns The user or null if not found
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.board', 'board')
      .leftJoinAndSelect('board.columns', 'columns')
      .where('user.phone = :phone', { phone })
      .getOne()
  }

  /**
   * Find a user by their ID
   * @param id The user ID
   * @returns The user or null if not found
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    })
  }

  async getUser(user: User): Promise<ApiResponseDto<{ user: User | null }>> {
    const fromDB = await this.userRepository.findOne({
      where: { id: user.id },
      select: [
        'id',
        'name',
        'email',
        'phone',
        'phoneVerified',
        'licenseNumber',
        'taxIdentificationNumber',
        'specialization',
        'languages',
      ],
    })

    return new ApiResponseDto({
      success: true,
      data: {
        user: fromDB,
      },
    })
  }
}
