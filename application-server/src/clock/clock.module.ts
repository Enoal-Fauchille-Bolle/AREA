import { Module } from '@nestjs/common';
import { ClockService } from './clock.service';
import { HookStatesModule } from '../hook-states/hook-states.module';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { AreasModule } from '../areas/areas.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    HookStatesModule,
    AreaExecutionsModule,
    AreasModule,
    AreaParametersModule,
    CommonModule,
  ],
  providers: [ClockService],
  exports: [ClockService],
})
export class ClockModule {}
