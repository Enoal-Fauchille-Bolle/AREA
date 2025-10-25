import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
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
  getOAuthProviderFromString,
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

    // Check for email conflict
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersService.findByEmail(
        updateProfileDto.email,
      );
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
    // Temporary created a Type based on what's below
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
      updateData.icon_path = updateProfileDto.icon_url; // Map to icon_path field
    if (updateProfileDto.password)
      updateData.password = updateProfileDto.password; // UsersService will hash this

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

  // OAuth2 methods
  async loginWithOAuth2(body: OAuthLoginDto): Promise<AuthResponseDto> {
    const provider = getOAuthProviderFromString(body.provider);
    if (!provider) {
      throw new BadRequestException(
        `Unsupported OAuth2 provider: ${body.provider}`,
      );
    }

    const userInfo = await this.oauth2Service.exchangeCodeAndGetUserInfo({
      code: body.code,
      provider: provider,
      redirect_uri: body.redirect_uri,
    });

    // Can't only capitalize the provider to get service name because of GitHub.
    const service = await this.servicesService.findByName(
      OAuthProviderServiceNameMap[provider],
    );

    const userAccount =
      await this.userOAuth2AccountsService.findByServiceAccountId(
        service.id,
        userInfo.id,
      );

    if (userAccount) {
      if (userInfo.email && userAccount.email !== userInfo.email) {
        // Update email if it has changed
        await this.userOAuth2AccountsService.updateEmail(
          userAccount.user.id,
          service.id,
          userInfo.email,
        );
      }
      await this.usersService.updateLastConnection(userAccount.user.id);
      return new AuthResponseDto(
        this.jwtService.sign({
          email: userAccount.user.email,
          sub: userAccount.user.id,
          username: userAccount.user.username,
        }),
      );
    }

    if (!userInfo.email) {
      throw new UnauthorizedException(
        'OAuth2 provider did not return an email address: cannot proceed without email verification',
      );
    }

    const user = await this.usersService.findByEmail(userInfo.email);
    if (!user) {
      throw new UnauthorizedException(
        'No account associated with this OAuth2 account. Please register first.',
      );
    }

    // Create OAuth2 account link
    await this.userOAuth2AccountsService.create({
      service_id: service.id,
      oauth2_provider_user_id: userInfo.id,
      user_id: user.id,
      email: userInfo.email,
    });
    await this.usersService.updateLastConnection(user.id);

    const payload = {
      email: user.email,
      sub: user.id,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);

    return new AuthResponseDto(token);
  }

  async registerWithOAuth2(body: OAuthRegisterDto): Promise<AuthResponseDto> {
    const provider = getOAuthProviderFromString(body.provider);
    if (!provider) {
      throw new BadRequestException(
        `Unsupported OAuth2 provider: ${body.provider}`,
      );
    }

    const userInfo = await this.oauth2Service.exchangeCodeAndGetUserInfo({
      code: body.code,
      provider: provider,
      redirect_uri: body.redirect_uri,
    });

    if (!userInfo.email) {
      throw new UnauthorizedException(
        'OAuth2 provider did not return an email address: cannot proceed without email verification',
      );
    }

    // Check if user already exists
    const user = await this.usersService.findByEmail(userInfo.email);
    if (user) {
      throw new ConflictException(
        'An account with this email already exists. Please login instead.',
      );
    }

    let username = createUsernameFromProviderInfo(userInfo.rawData);
    // Should not happen
    if (!username) {
      throw new InternalServerErrorException(
        'Failed to generate a username from OAuth2 provider data',
      );
    }

    if (await this.usersService.findByUsername(username)) {
      username = `${provider}_user_${userInfo.id}`;
      if (await this.usersService.findByUsername(username)) {
        throw new ConflictException(
          'Generated username from OAuth2 provider data already exists. Please choose a different registration method.',
        );
      }
    }

    // Create new user
    const newUser = await this.usersService.createWithoutPassword({
      email: userInfo.email,
      username: username,
    });

    // Create OAuth2 account link
    const service = await this.servicesService.findByName(
      OAuthProviderServiceNameMap[provider],
    );

    await this.userOAuth2AccountsService.create({
      service_id: service.id,
      oauth2_provider_user_id: userInfo.id,
      user_id: newUser.id,
      email: userInfo.email,
    });

    const payload = {
      email: newUser.email,
      sub: newUser.id,
      username: newUser.username,
    };
    const token = this.jwtService.sign(payload);

    return new AuthResponseDto(token);
  }
}
