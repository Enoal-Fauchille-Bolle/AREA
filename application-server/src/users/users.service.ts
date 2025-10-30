import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import type { AppConfig } from '../config';

@Injectable()
export class UsersService {
  private readonly appConfig: AppConfig;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      throw new Error('App configuration is not properly loaded');
    }
    this.appConfig = appConfig;
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Hash the password
    const saltRounds = this.appConfig.bcryptSaltRounds;
    const password_hash = await bcrypt.hash(createUserDto.password, saltRounds);

    const { password, ...userWithoutPassword } = createUserDto;

    const user = this.usersRepository.create({
      ...userWithoutPassword,
      password_hash,
      is_admin: createUserDto.is_admin ?? false,
      is_active: createUserDto.is_active ?? true,
    });

    const savedUser = await this.usersRepository.save(user);
    return new UserResponseDto(savedUser);
  }

  async createWithoutPassword(
    createUserDto: Omit<CreateUserDto, 'password'>,
  ): Promise<UserResponseDto> {
    const user = this.usersRepository.create({
      ...createUserDto,
      is_admin: createUserDto.is_admin ?? false,
      is_active: createUserDto.is_active ?? true,
    });
    const savedUser = await this.usersRepository.save(user);
    return new UserResponseDto(savedUser);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => new UserResponseDto(user));
  }

  async findOne(id: number): Promise<UserResponseDto | undefined> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user ? new UserResponseDto(user) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user || undefined;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { username } });
    return user || undefined;
  }

  async findByUsernamePublic(
    username: string,
  ): Promise<UserResponseDto | undefined> {
    const user = await this.usersRepository.findOne({ where: { username } });
    return user ? new UserResponseDto(user) : undefined;
  }

  // Internal method that returns full user with password hash (for authentication)
  async findUserForAuth(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user || undefined;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    // Handle password update if provided
    let updateData: Partial<User> = { ...updateUserDto };
    if (updateUserDto.password) {
      const saltRounds = this.appConfig.bcryptSaltRounds;
      const password_hash = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
      const { password, ...dataWithoutPassword } = updateUserDto;
      updateData = { ...dataWithoutPassword, password_hash };
    }

    await this.usersRepository.update(id, updateData);
    const updatedUser = await this.usersRepository.findOne({ where: { id } });
    return updatedUser ? new UserResponseDto(updatedUser) : null;
  }

  async updateLastConnection(id: number): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    user.last_connection_at = new Date();
    const updatedUser = await this.usersRepository.save(user);
    return new UserResponseDto(updatedUser);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.password_hash) {
      return false;
    }
    return bcrypt.compare(password, user.password_hash);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.usersRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async setVerificationCode(
    email: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.usersRepository.update(
      { email },
      {
        email_verification_code: code,
        email_verification_expires: expiresAt,
        is_email_verified: false,
      },
    );
  }

  async verifyEmail(email: string, code: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      return false;
    }

    // Check if code matches
    if (user.email_verification_code !== code) {
      return false;
    }

    // Check if code is expired
    if (
      !user.email_verification_expires ||
      user.email_verification_expires < new Date()
    ) {
      return false;
    }

    // Mark as verified and clear verification data
    await this.usersRepository.update(
      { email },
      {
        is_email_verified: true,
        email_verified_at: new Date(),
        email_verification_code: null,
        email_verification_expires: null,
      },
    );

    return true;
  }

  async isEmailVerified(email: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user?.is_email_verified ?? false;
  }
}
