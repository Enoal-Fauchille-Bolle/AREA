import { Module, forwardRef } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';
import { AreasModule } from '../areas/areas.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    AreaExecutionsModule,
    AreaParametersModule,
    AreasModule,
    forwardRef(() => CommonModule),
  ],
  providers: [DiscordService],
  exports: [DiscordService],
})
export class DiscordModule {}
