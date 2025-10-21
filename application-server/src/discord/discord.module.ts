import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';

@Module({
  imports: [AreaExecutionsModule, AreaParametersModule],
  providers: [DiscordService],
  exports: [DiscordService],
})
export class DiscordModule {}
