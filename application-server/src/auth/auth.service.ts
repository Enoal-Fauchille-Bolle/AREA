import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ServicesService } from '../services/services.service';
import { UserOAuth2AccountsService } from './user-oauth2-account/user-oauth2-account.service';
import { OAuth2Service } from '../oauth2/oauth2.service';
import {
  RegisterDto,
  OAuthRegisterDto,
  LoginDto,
  OAuthLoginDto,
  UpdateProfileDto,
  AuthResponseDto,
} from './dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  OAuthProviderServiceNameMap,
  createUsernameFromProviderInfo,
} from '../oauth2/dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private servicesService: ServicesService,
    private userOAuth2AccountsService: UserOAuth2AccountsService,
    private oauth2Service: OAuth2Service,
    private jwtService: JwtService,
  ) {}

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
      const { password_hash, ...result } = user;
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

    const user = await this.usersService.create({
      email: registerDto.email,
      username: registerDto.username,
      password: registerDto.password,
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
    return user;
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersService.findByEmail(
        updateProfileDto.email,
      );
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

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

    const updateData: {
      email?: string;
      username?: string;
      icon_path?: string;
      password?: string;
    } = {};
    if (updateProfileDto.email) updateData.email = updateProfileDto.email;
    if (updateProfileDto.username)
      updateData.username = updateProfileDto.username;
    if (updateProfileDto.icon_url)
      updateData.icon_path = updateProfileDto.icon_url;
    if (updateProfileDto.password)
      updateData.password = updateProfileDto.password;

    const updatedUser = await this.usersService.update(userId, updateData);
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }
    return updatedUser;
  }

  async deleteProfile(userId: number): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.remove(userId);
  }

  async loginWithOAuth2(body: OAuthLoginDto): Promise<AuthResponseDto> {
    const userInfo = await this.oauth2Service.exchangeCodeAndGetUserInfo({
      code: body.code,
      provider: body.provider,
      redirect_uri: body.redirect_uri,
    });

    if (!userInfo.email) {
      throw new UnauthorizedException(
        'OAuth2 provider did not return an email address: cannot proceed without email verification',
      );
    }

    const serviceName = OAuthProviderServiceNameMap[body.provider];
    const service = await this.servicesService.findByName(serviceName);

    const userAccount =
      await this.userOAuth2AccountsService.findByServiceAccountId(
        service.id,
        userInfo.id,
      );

    if (!userAccount) {
      throw new UnauthorizedException(
        'No account associated with this OAuth2 provider. Please register first.',
      );
    }

    const user = await this.usersService.findOne(userAccount.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.updateLastConnection(user.id);

    const payload = { email: user.email, sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return new AuthResponseDto(token);
  }

  async registerWithOAuth2(body: OAuthRegisterDto): Promise<AuthResponseDto> {
    const userInfo = await this.oauth2Service.exchangeCodeAndGetUserInfo({
      code: body.code,
      provider: body.provider,
      redirect_uri: body.redirect_uri,
    });

    if (!userInfo.email) {
      throw new UnauthorizedException(
        'OAuth2 provider did not return an email address: cannot proceed without email verification',
      );
    }

    const serviceName = OAuthProviderServiceNameMap[body.provider];
    const service = await this.servicesService.findByName(serviceName);

    const userAccount =
      await this.userOAuth2AccountsService.findByServiceAccountId(
        service.id,
        userInfo.id,
      );

    if (userAccount) {
      throw new ConflictException(
        'An account with this OAuth2 provider already exists. Please login instead.',
      );
    }

    const existingUser = await this.usersService.findByEmail(userInfo.email);
    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists. Please login instead.',
      );
    }

    let generatedUsername = createUsernameFromProviderInfo(userInfo.rawData);
    if (!generatedUsername) {
      throw new InternalServerErrorException(
        'Failed to generate a username from OAuth2 provider data',
      );
    }

    if (await this.usersService.findByUsername(generatedUsername)) {
      generatedUsername = `${body.provider}_user_${userInfo.id}`;
      if (await this.usersService.findByUsername(generatedUsername)) {
        generatedUsername = `${body.provider}_user_${userInfo.id}_${Date.now()}`;
      }
    }

    const newUser = await this.usersService.createWithoutPassword({
      email: userInfo.email,
      username: generatedUsername,
    });

    await this.userOAuth2AccountsService.create({
      service_id: service.id,
      oauth2_provider_user_id: userInfo.id,
      user_id: newUser.id,
      email: userInfo.email,
    });

    await this.usersService.updateLastConnection(newUser.id);

    const payload = {
      email: newUser.email,
      sub: newUser.id,
      username: newUser.username,
    };
    const token = this.jwtService.sign(payload);

    return new AuthResponseDto(token);
  }
}
