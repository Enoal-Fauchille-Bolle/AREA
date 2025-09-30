import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaExecutionsService } from './area-executions.service';
import { AreaExecutionsController } from './area-executions.controller';
import { AreaExecution } from './entities/area-execution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AreaExecution])],
  controllers: [AreaExecutionsController],
  providers: [AreaExecutionsService],
  exports: [AreaExecutionsService],
})
export class AreaExecutionsModule {}