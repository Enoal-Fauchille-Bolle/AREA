import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig, validateEnv } from './config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { UserOAuth2Account } from './auth/user-oauth2-account/entities/user-oauth2-account.entity';
import { UserService } from './services/user-services/entities/user-service.entity';
import { Service } from './services/entities/service.entity';
import { Component } from './components/entities/component.entity';
import { Variable } from './variables/entities/variable.entity';
import { Area } from './areas/entities/area.entity';
import { AreaParameter } from './area-parameters/entities/area-parameter.entity';
import { HookState } from './hook-states/entities/hook-state.entity';
import { AreaExecution } from './area-executions/entities/area-execution.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { OAuth2Module } from './oauth2';
import { ServicesModule } from './services/services.module';
import { ComponentsModule } from './components/components.module';
import { VariablesModule } from './variables/variables.module';
import { AreasModule } from './areas/areas.module';
import { AreaParametersModule } from './area-parameters/area-parameters.module';
import { HookStatesModule } from './hook-states/hook-states.module';
import { AreaExecutionsModule } from './area-executions/area-executions.module';
import { AuthModule } from './auth/auth.module';
import { WellKnownModule } from './well-known';
import { ClockModule } from './clock/clock.module';
import { EmailModule } from './email/email.module';
import { GithubModule } from './github/github.module';
import { DiscordModule } from './discord/discord.module';
import { CommonModule } from './common/common.module';
import { GmailModule } from './gmail/gmail.module';
import { TwitchModule } from './twitch/twitch.module';
import { SpotifyModule } from './spotify/spotify.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const appConfig = configService.get('app');
        return {
          type: 'postgres',
          host: appConfig.database.host,
          port: appConfig.database.port,
          username: appConfig.database.username,
          password: appConfig.database.password,
          database: appConfig.database.database,
          entities: [
            User,
            UserOAuth2Account,
            UserService,
            Service,
            Component,
            Variable,
            Area,
            AreaParameter,
            HookState,
            AreaExecution,
          ],
          synchronize: appConfig.database.synchronize,
          logging: appConfig.database.logging,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    OAuth2Module,
    ServicesModule,
    ComponentsModule,
    VariablesModule,
    AreasModule,
    AreaParametersModule,
    HookStatesModule,
    AreaExecutionsModule,
    AuthModule,
    WellKnownModule,
    ClockModule,
    EmailModule,
    GithubModule,
    DiscordModule,
    CommonModule,
    GmailModule,
    TwitchModule,
    SpotifyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
