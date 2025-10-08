import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Service } from './entities/service.entity';
import { Component } from '../components/entities/component.entity';
import { Variable } from '../variables/entities/variable.entity';
import { UserService } from '../user-services/entities/user-service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, Component, Variable, UserService]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
