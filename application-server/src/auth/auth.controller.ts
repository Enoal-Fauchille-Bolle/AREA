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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateProfileDto, OAuthLoginDto, AuthResponseDto } from './dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Request() req): Promise<AuthResponseDto> {
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
  async loginOAuth2(@Body() oauthLoginDto: OAuthLoginDto): Promise<AuthResponseDto> {
    return this.authService.loginWithOAuth2(oauthLoginDto.service, oauthLoginDto.code);
  }

  @Post('register-oauth2')
  @HttpCode(HttpStatus.CREATED)
  async registerOAuth2(@Body() oauthLoginDto: OAuthLoginDto): Promise<AuthResponseDto> {
    return this.authService.registerWithOAuth2(oauthLoginDto.service, oauthLoginDto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req): Promise<UserResponseDto> {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@Request() req): Promise<void> {
    return this.authService.deleteProfile(req.user.id);
  }
}