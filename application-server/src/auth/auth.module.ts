import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOAuth2Account } from './user-oauth2-account';
import { UsersModule } from '../users';
import { ServicesModule } from '../services';
import { OAuth2Module } from '../oauth2';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserOAuth2AccountsService } from './user-oauth2-account';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOAuth2Account]),
    UsersModule,
    ServicesModule,
    OAuth2Module,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const appConfig = configService.get('app');
        return {
          secret: appConfig.jwt.secret,
          signOptions: {
            expiresIn: appConfig.jwt.expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UserOAuth2AccountsService,
  ],
  controllers: [AuthController],
  exports: [AuthService, UserOAuth2AccountsService],
})
export class AuthModule {}
