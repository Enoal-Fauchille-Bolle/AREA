import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOAuth2Account } from './entities/user-oauth2-account.entity';
import { UserOAuth2AccountResponseDto, CreateOAuth2AccountDto } from './dto';
import { UsersService } from '../../users/users.service';
import { ServicesService } from '../../services/services.service';

@Injectable()
export class UserOAuth2AccountsService {
  constructor(
    @InjectRepository(UserOAuth2Account)
    private readonly userOAuth2AccountRepository: Repository<UserOAuth2Account>,
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(
    createAccountDto: CreateOAuth2AccountDto,
  ): Promise<UserOAuth2AccountResponseDto> {
    const existingAccount = await this.userOAuth2AccountRepository.findOne({
      where: {
        user_id: createAccountDto.user_id,
        service_id: createAccountDto.service_id,
      },
    });

    if (existingAccount) {
      throw new ConflictException(
        'User already has an OAuth2 account for this service',
      );
    }

    const user = await this.usersService.findOne(createAccountDto.user_id);
    const service = await this.servicesService.findOne(
      createAccountDto.service_id,
    );

    if (!user || !service) {
      throw new NotFoundException(
        'User or Service not found for the provided IDs',
      );
    }

    if (!service.requires_auth) {
      throw new ConflictException(
        'Cannot create OAuth2 account for a service that does not require authentication',
      );
    }

    const oauth2Account = this.userOAuth2AccountRepository.create({
      service_id: createAccountDto.service_id,
      service_account_id: createAccountDto.oauth2_provider_user_id,
      user_id: createAccountDto.user_id,
      email: createAccountDto.email ?? null,
    });
    const savedAccount =
      await this.userOAuth2AccountRepository.save(oauth2Account);
    return UserOAuth2AccountResponseDto.fromEntity(savedAccount);
  }

  async findOne(
    user_id: number,
    service_id: number,
  ): Promise<UserOAuth2AccountResponseDto | null> {
    const account = await this.userOAuth2AccountRepository.findOne({
      where: { user_id, service_id },
      relations: ['user', 'service'],
    });

    return account ? UserOAuth2AccountResponseDto.fromEntity(account) : null;
  }

  async findByServiceAccountId(
    service_id: number,
    service_account_id: string,
  ): Promise<UserOAuth2AccountResponseDto | null> {
    const account = await this.userOAuth2AccountRepository.findOne({
      where: { service_id, service_account_id },
      relations: ['user', 'service'],
    });

    return account ? UserOAuth2AccountResponseDto.fromEntity(account) : null;
  }

  async updateEmail(
    user_id: number,
    service_id: number,
    newEmail: string,
  ): Promise<UserOAuth2AccountResponseDto> {
    const account = await this.userOAuth2AccountRepository.findOne({
      where: { user_id, service_id },
    });

    if (!account) {
      throw new NotFoundException(
        'OAuth2 account not found for the provided user and service IDs',
      );
    }

    account.email = newEmail;
    const updatedAccount = await this.userOAuth2AccountRepository.save(account);
    return UserOAuth2AccountResponseDto.fromEntity(updatedAccount);
  }

  async removeOne(user_id: number, service_id: number): Promise<void> {
    const account = await this.userOAuth2AccountRepository.findOne({
      where: { user_id, service_id },
    });

    if (!account) {
      throw new NotFoundException(
        'OAuth2 account not found for the provided user and service IDs',
      );
    }

    await this.userOAuth2AccountRepository.remove(account);
  }
}
