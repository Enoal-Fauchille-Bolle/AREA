import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GmailReactionsService } from './gmail-reactions.service';
import { AreaExecutionsModule } from '../../area-executions/area-executions.module';
import { AreaParametersModule } from '../../area-parameters/area-parameters.module';
import { ServicesModule } from '../../services/services.module';
import { Area } from '../../areas/entities/area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Area]),
    AreaExecutionsModule,
    AreaParametersModule,
    ServicesModule,
  ],
  providers: [GmailReactionsService],
  exports: [GmailReactionsService],
})
export class GmailReactionsModule {}
