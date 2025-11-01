import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrelloService } from './trello.service';
import { TrelloReactionsModule } from './reactions/trello-reactions.module';
import { Area } from '../areas/entities/area.entity';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';
import { ServicesModule } from '../services/services.module';
import { HookStatesModule } from '../hook-states/hook-states.module';
import { AreasModule } from '../areas/areas.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Area]),
    AreaExecutionsModule,
    AreaParametersModule,
    ServicesModule,
    HookStatesModule,
    forwardRef(() => AreasModule),
    forwardRef(() => CommonModule),
    TrelloReactionsModule,
  ],
  providers: [TrelloService],
  exports: [TrelloService, TrelloReactionsModule],
})
export class TrelloModule {}
