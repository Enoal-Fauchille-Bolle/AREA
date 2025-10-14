import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';
import { UserServicesModule } from '../user-services/user-services.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import type { AppConfig } from '../config';

@Module({
  imports: [
    UsersModule,
    ServicesModule,
    UserServicesModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const appConfig = configService.get<AppConfig>('app');
        if (!appConfig) {
          throw new Error('App configuration is not properly loaded');
        }

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
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
