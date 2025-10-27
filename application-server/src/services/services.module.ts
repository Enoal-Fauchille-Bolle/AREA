import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { UserService } from './user-services/entities/user-service.entity';
import { UsersModule } from '../users/users.module';
import { ComponentsModule } from '../components/components.module';
import { VariablesModule } from '../variables/variables.module';
import { OAuth2Module } from '../oauth2';
import { ServicesService } from './services.service';
import { UserServicesService } from './user-services/user-services.service';
import { ServicesController } from './services.controller';
import { ServicesInitializerService } from './services-initializer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, UserService]),
    UsersModule,
    ComponentsModule,
    VariablesModule,
    OAuth2Module,
  ],
  controllers: [ServicesController],
  providers: [ServicesService, UserServicesService, ServicesInitializerService],
  exports: [ServicesService, UserServicesService],
})
export class ServicesModule {}
