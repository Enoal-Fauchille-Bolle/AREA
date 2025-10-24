import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ServicesService } from '../services/services.service';
import {
  RegisterDto,
  OAuthRegisterDto,
  LoginDto,
  OAuthLoginDto,
  UpdateProfileDto,
  AuthResponseDto,
} from './dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { GoogleOAuth2Service } from '../services/oauth2/google-oauth2.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private servicesService: ServicesService,
    private googleOAuth2Service: GoogleOAuth2Service,
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

      // 1. Exchange code for access token
      const tokenData = await this.googleOAuth2Service.exchangeCodeForTokens(
        code,
        redirectUri,
        codeVerifier,
      );

      // 2. Fetch user info from provider
      const googleUser = await this.googleOAuth2Service.getUserInfo(
        tokenData.accessToken,
      );

      // 3. Find Google service in database
      const googleService = await this.servicesService.findByName('Google');

    // 4. Check if user exists (by email)
    const existingUser = await this.usersService
      .findByEmail(googleUser.email)
      .catch(() => null);

    let user: UserResponseDto;

    if (!existingUser) {
      // User doesn't exist, create new account (auto-register)
      // Generate a username from email
      const baseUsername = googleUser.email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '');

      // Check if username already exists and add counter if needed
      let finalUsername = baseUsername;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const existingUser =
          await this.usersService.findByUsername(finalUsername);
        if (!existingUser) {
          // Username doesn't exist, we can use it
          break;
        }
        // Username exists, try with counter
        attempts++;
        finalUsername = `${baseUsername}${attempts}`;
      }

      // If we still can't find a unique username, use timestamp
      if (attempts >= maxAttempts) {
        finalUsername = `${baseUsername}${Date.now()}`;
      }

      console.log(`[OAuth2] Creating new user with username: ${finalUsername}`);

      user = await this.usersService.create({
        email: googleUser.email,
        username: finalUsername,
        password: Math.random().toString(36).substring(2, 15), // Random password for OAuth users
      });
    } else {
      // Convert User entity to UserResponseDto
      const foundUser = await this.usersService.findOne(existingUser.id);
      if (!foundUser) {
        throw new Error('User not found after lookup');
      }
      user = foundUser;
    }

    // 5. Store/update OAuth tokens in UserServices
    const existingConnection =
      await this.userServicesService.findUserServiceConnection(
        user.id,
        googleService.id,
      );

    if (existingConnection) {
      // Update existing connection
      await this.userServicesService.refreshToken(
        user.id,
        tokenData.accessToken,
        tokenData.refreshToken || undefined,
        tokenData.expiresAt,
      );
    } else {
      // Create new connection
      await this.userServicesService.create({
        user_id: user.id,
        service_id: googleService.id,
        oauth_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken || undefined,
        token_expires_at: tokenData.expiresAt,
      });
    }

    // 6. Update last connection
    await this.usersService.updateLastConnection(user.id);

    // 7. Generate JWT token
    const payload = {
      email: user.email,
      sub: user.id,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);

    return new AuthResponseDto(token);
  }

  async registerWithOAuth2(body: OAuthRegisterDto): Promise<AuthResponseDto> {
  }
}
