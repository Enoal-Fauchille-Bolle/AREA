import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserServicesService } from './user-services.service';
import { UserServicesController } from './user-services.controller';
import { UserService } from './entities/user-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserService])],
  controllers: [UserServicesController],
  providers: [UserServicesService],
  exports: [UserServicesService],
})
export class UserServicesModule {}