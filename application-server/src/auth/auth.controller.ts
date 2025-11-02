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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
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
  handleNonMobileRequest,
  isMobileRequest,
  getOAuthProviderFromString,
} from '../oauth2';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({
    summary: 'OAuth2 callback for mobile',
    description:
      'Handles OAuth2 callback and redirects mobile apps with authorization code',
  })
  @ApiHeader({
    name: 'user-agent',
    description: 'User agent string',
    required: true,
  })
  @ApiQuery({ name: 'code', description: 'OAuth2 authorization code' })
  @ApiQuery({ name: 'state', description: 'OAuth2 provider name' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to mobile app with OAuth code',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Missing or invalid OAuth parameters',
  })
  // Mobile OAuth2 Callback Endpoint (auto redirect)
  @Get('callback')
  oauth2Callback(
    @Headers('user-agent') userAgent: string,
    @Query('code') code: string,
    @Query('state') provider: string,
    @Res() res: Response,
  ) {
    if (!isMobileRequest(userAgent)) {
      return handleNonMobileRequest(res);
    }
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
    return handleMobileCallback(
      res,
      oauthProvider,
      code,
      'auth',
      this.configService,
    );
  }

  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates a user with email and password, returns a JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
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

  @ApiOperation({
    summary: 'Register new user',
    description:
      'Creates a new user account with email, username, and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input or user already exists',
  })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @ApiOperation({
    summary: 'Login with OAuth2',
    description:
      'Authenticates a user using OAuth2 provider (Google, GitHub, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated via OAuth2',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - OAuth2 authentication failed',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OAuth2 parameters',
  })
  @Post('login-oauth2')
  @HttpCode(HttpStatus.OK)
  async loginOAuth2(
    @Body() oauthLoginDto: OAuthLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithOAuth2(oauthLoginDto);
  }

  @ApiOperation({
    summary: 'Register with OAuth2',
    description: 'Creates a new user account using OAuth2 provider',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered via OAuth2',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid OAuth2 parameters or user already exists',
  })
  @Post('register-oauth2')
  @HttpCode(HttpStatus.CREATED)
  async registerOAuth2(
    @Body() oauthLoginDto: OAuthRegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.registerWithOAuth2(oauthLoginDto);
  }

  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieves the profile of the authenticated user',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(
    @Request() req: { user: { id: number } },
  ): Promise<UserResponseDto> {
    return this.authService.getProfile(req.user.id);
  }

  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates the profile of the authenticated user',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Profile successfully updated',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Request() req: { user: { id: number } },
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @ApiOperation({
    summary: 'Delete user account',
    description: 'Permanently deletes the authenticated user account',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 204,
    description: 'Account successfully deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@Request() req: { user: { id: number } }): Promise<void> {
    return this.authService.deleteProfile(req.user.id);
  }

  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verifies a user email address using the verification code',
  })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email verified successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or expired verification code',
  })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @ApiOperation({
    summary: 'Resend verification code',
    description: 'Sends a new verification code to the user email address',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Verification code resent successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerificationCode(resendVerificationDto);
  }
}
