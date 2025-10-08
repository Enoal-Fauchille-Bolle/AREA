import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordService } from './discord.service';
import { HookStatesModule } from '../hook-states/hook-states.module';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { AreasModule } from '../areas/areas.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';
import { UserServicesModule } from '../user-services/user-services.module';
import { ServicesModule } from '../services/services.module';
import { Area } from '../areas/entities/area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Area]),
    HookStatesModule,
    AreaExecutionsModule,
    AreasModule,
    AreaParametersModule,
    UserServicesModule,
    ServicesModule,
  ],
  providers: [DiscordService],
  exports: [DiscordService],
})
export class DiscordModule {}
