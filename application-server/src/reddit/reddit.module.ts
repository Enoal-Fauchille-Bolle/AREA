import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from '../areas/entities/area.entity';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';
import { ServicesModule } from '../services/services.module';
import { HookStatesModule } from '../hook-states/hook-states.module';
import { AreasModule } from '../areas/areas.module';
import { CommonModule } from '../common/common.module';
import { RedditService } from './reddit.service';
import { RedditReactionsModule } from './reactions/reddit-reactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Area]),
    AreaExecutionsModule,
    AreaParametersModule,
    ServicesModule,
    HookStatesModule,
    forwardRef(() => AreasModule),
    forwardRef(() => CommonModule),
    RedditReactionsModule,
  ],
  providers: [RedditService],
  exports: [RedditService],
})
export class RedditModule {}
