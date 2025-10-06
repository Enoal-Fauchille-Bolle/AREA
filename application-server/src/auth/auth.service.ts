import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  AuthResponseDto,
} from './dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Replace 'UserEntity' with the actual user type used in your project
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.password_hash &&
      (await bcrypt.compare(password, user.password_hash))
    ) {
      const { ...result } = user;
      return result as UserResponseDto;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user: UserResponseDto | null = await this.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last connection
    await this.usersService.updateLastConnection(user.id);

    const payload = {
      email: user.email,
      sub: user.id,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);

    return new AuthResponseDto(token);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUserByEmail = await this.usersService
      .findByEmail(registerDto.email)
      .catch(() => null);
    if (existingUserByEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUserByUsername = await this.usersService
      .findByUsername(registerDto.username)
      .catch(() => null);
    if (existingUserByUsername) {
      throw new ConflictException('Username already in use');
    }

    // Create new user
    const user = await this.usersService.create({
      email: registerDto.email,
      username: registerDto.username,
      password: registerDto.password, // UsersService will hash this
    });

    const payload = {
      email: user.email,
      sub: user.id,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);

    return new AuthResponseDto(token);
  }

  async getProfile(userId: number): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return new UserResponseDto(user);
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for email conflict
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersService
        .findByEmail(updateProfileDto.email)
        .catch(() => null);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Check for username conflict
    if (
      updateProfileDto.username &&
      updateProfileDto.username !== user.username
    ) {
      const existingUser = await this.usersService
        .findByUsername(updateProfileDto.username)
        .catch(() => null);
      if (existingUser) {
        throw new ConflictException('Username already in use');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (updateProfileDto.email) updateData.email = updateProfileDto.email;
    if (updateProfileDto.username)
      updateData.username = updateProfileDto.username;
    if (updateProfileDto.icon_url)
      updateData.icon_path = updateProfileDto.icon_url; // Map to icon_path field
    if (updateProfileDto.password)
      updateData.password = updateProfileDto.password; // UsersService will hash this

    const updatedUser = await this.usersService.update(userId, updateData);
    return new UserResponseDto(updatedUser);
  }

  async deleteProfile(userId: number): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.remove(userId);
  }

  // OAuth2 methods - placeholder for now
  async loginWithOAuth2(
    service: string,
    code: string,
  ): Promise<AuthResponseDto> {
    // TODO: Implement OAuth2 login flow
    // 1. Exchange code for access token
    // 2. Fetch user info from provider
    // 3. Check if user exists, login or create account
    // 4. Generate JWT token
    throw new Error('OAuth2 login not yet implemented');
  }

  async registerWithOAuth2(
    service: string,
    code: string,
  ): Promise<AuthResponseDto> {
    // TODO: Implement OAuth2 registration flow
    // 1. Exchange code for access token
    // 2. Fetch user info from provider
    // 3. Create new user account
    // 4. Store OAuth tokens in UserServices
    // 5. Generate JWT token
    throw new Error('OAuth2 registration not yet implemented');
  }
}
