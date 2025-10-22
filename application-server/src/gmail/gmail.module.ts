import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GmailService } from './gmail.service';
import { HookStatesModule } from '../hook-states/hook-states.module';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { AreasModule } from '../areas/areas.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';
import { UserServicesModule } from '../user-services/user-services.module';
import { ServicesModule } from '../services/services.module';
import { CommonModule } from '../common/common.module';
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
    forwardRef(() => CommonModule),
  ],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}
