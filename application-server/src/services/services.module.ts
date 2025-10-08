import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServicesInitializerService } from './services-initializer.service';
import { Service } from './entities/service.entity';
import { ComponentsModule } from '../components/components.module';
import { VariablesModule } from '../variables/variables.module';
import { Component } from '../components/entities/component.entity';
import { Variable } from '../variables/entities/variable.entity';
import { UserService } from '../user-services/entities/user-service.entity';
import { DiscordOAuth2Service } from './oauth2/discord-oauth2.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, Component, Variable, UserService]),
    ComponentsModule,
    VariablesModule,
  ],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    ServicesInitializerService,
    DiscordOAuth2Service,
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
