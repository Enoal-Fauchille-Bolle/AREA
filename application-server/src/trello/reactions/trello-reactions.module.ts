import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrelloReactionsService } from './trello-reactions.service';
import { Area } from '../../areas/entities/area.entity';
import { AreaExecutionsModule } from '../../area-executions/area-executions.module';
import { AreaParametersModule } from '../../area-parameters/area-parameters.module';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Area]),
    AreaExecutionsModule,
    AreaParametersModule,
    ServicesModule,
  ],
  providers: [TrelloReactionsService],
  exports: [TrelloReactionsService],
})
export class TrelloReactionsModule {}
