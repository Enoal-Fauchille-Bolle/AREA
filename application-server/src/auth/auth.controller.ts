import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { type Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
  OAuthLoginDto,
  AuthResponseDto,
  OAuthRegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  handleMobileCallback,
  isMobileRequest,
  getOAuthProviderFromString,
} from '../oauth2';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // Mobile OAuth2 Callback Endpoint (auto redirect)
  @Get('callback')
  oauth2Callback(
    @Headers('user-agent') userAgent: string,
    @Query('code') code: string,
    @Query('state') provider: string,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Missing OAuth code');
    }
    if (!provider) {
      throw new BadRequestException('Missing OAuth provider');
    }
    const oauthProvider = getOAuthProviderFromString(provider);
    if (!oauthProvider) {
      throw new BadRequestException('Invalid OAuth provider');
    }
    if (isMobileRequest(userAgent)) {
      return handleMobileCallback(
        res,
        oauthProvider,
        code,
        'auth',
        this.configService,
      );
    }
    return 'Redirecting to mobile application...\n';
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Request() _req: Request,
  ): Promise<AuthResponseDto> {
    // LocalAuthGuard validates credentials and attaches user to request
    return this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login-oauth2')
  @HttpCode(HttpStatus.OK)
  async loginOAuth2(
    @Body() oauthLoginDto: OAuthLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithOAuth2(oauthLoginDto);
  }

  @Post('register-oauth2')
  @HttpCode(HttpStatus.CREATED)
  async registerOAuth2(
    @Body() oauthLoginDto: OAuthRegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.registerWithOAuth2(oauthLoginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(
    @Request() req: { user: { id: number } },
  ): Promise<UserResponseDto> {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Request() req: { user: { id: number } },
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@Request() req: { user: { id: number } }): Promise<void> {
    return this.authService.deleteProfile(req.user.id);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerificationCode(resendVerificationDto);
  }
}
