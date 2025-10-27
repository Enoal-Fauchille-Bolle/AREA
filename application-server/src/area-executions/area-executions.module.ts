import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaExecutionsService } from './area-executions.service';
import { AreaExecutionsController } from './area-executions.controller';
import { AreaExecution } from './entities/area-execution.entity';
import { AreasModule } from '../areas/areas.module';

@Module({
  imports: [TypeOrmModule.forFeature([AreaExecution]), AreasModule],
  controllers: [AreaExecutionsController],
  providers: [AreaExecutionsService],
  exports: [AreaExecutionsService],
})
export class AreaExecutionsModule {}
