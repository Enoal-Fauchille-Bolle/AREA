import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { type AppConfig, appConfig, validateEnv } from './config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { UserServicesModule } from './user-services/user-services.module';
import { UserOAuth2AccountModule } from './user-oauth2-account/user-oauth2-account.module';
import { ComponentsModule } from './components/components.module';
import { VariablesModule } from './variables/variables.module';
import { AreaParametersModule } from './area-parameters/area-parameters.module';
import { HookStatesModule } from './hook-states/hook-states.module';
import { AreaExecutionsModule } from './area-executions/area-executions.module';
import { AreasModule } from './areas/areas.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { Service } from './services/entities/service.entity';
import { UserService } from './user-services/entities/user-service.entity';
import { UserOAuth2Account } from './user-oauth2-account/entities/user-oauth2-account.entity';
import { Component } from './components/entities/component.entity';
import { Variable } from './variables/entities/variable.entity';
import { AreaParameter } from './area-parameters/entities/area-parameter.entity';
import { HookState } from './hook-states/entities/hook-state.entity';
import { AreaExecution } from './area-executions/entities/area-execution.entity';
import { Area } from './areas/entities/area.entity';
import { ClockModule } from './clock/clock.module';
import { EmailModule } from './email/email.module';
import { GithubModule } from './github/github.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const appConfig = configService.get<AppConfig>('app');
        if (!appConfig) {
          throw new Error('App configuration is not properly loaded');
        }
        return {
          type: 'postgres',
          host: configService.get('POSTGRES_HOST'),
          port: configService.get('POSTGRES_PORT'),
          username: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          database: configService.get('POSTGRES_DB'),
          entities: [
            User,
            Service,
            UserService,
            UserOAuth2Account,
            Component,
            Variable,
            AreaParameter,
            HookState,
            AreaExecution,
            Area,
          ],
          synchronize: appConfig.database.synchronize,
          logging: appConfig.database.logging,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    ServicesModule,
    UserServicesModule,
    UserOAuth2AccountModule,
    ComponentsModule,
    VariablesModule,
    AreaParametersModule,
    HookStatesModule,
    AreaExecutionsModule,
    AreasModule,
    AuthModule,
    ClockModule,
    EmailModule,
    GithubModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
