import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { UserServicesModule } from './user-services/user-services.module';
import { ComponentsModule } from './components/components.module';
import { VariablesModule } from './variables/variables.module';
import { AreaParametersModule } from './area-parameters/area-parameters.module';
import { HookStatesModule } from './hook-states/hook-states.module';
import { AreaExecutionsModule } from './area-executions/area-executions.module';
import { AreasModule } from './areas/areas.module';
import { User } from './users/entities/user.entity';
import { Service } from './services/entities/service.entity';
import { UserService } from './user-services/entities/user-service.entity';
import { Component } from './components/entities/component.entity';
import { Variable } from './variables/entities/variable.entity';
import { AreaParameter } from './area-parameters/entities/area-parameter.entity';
import { HookState } from './hook-states/entities/hook-state.entity';
import { AreaExecution } from './area-executions/entities/area-execution.entity';
import { Area } from './areas/entities/area.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [
          User,
          Service,
          UserService,
          Component,
          Variable,
          AreaParameter,
          HookState,
          AreaExecution,
          Area,
        ],
        synchronize: true, // creates tables automatically
        logging: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ServicesModule,
    UserServicesModule,
    ComponentsModule,
    VariablesModule,
    AreaParametersModule,
    HookStatesModule,
    AreaExecutionsModule,
    AreasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
