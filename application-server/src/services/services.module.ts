import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServicesInitializerService } from './services-initializer.service';
import { Service } from './entities/service.entity';
import { ComponentsModule } from '../components/components.module';
import { VariablesModule } from '../variables/variables.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service]),
    ComponentsModule,
    VariablesModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesInitializerService],
  exports: [ServicesService],
})
export class ServicesModule {}
