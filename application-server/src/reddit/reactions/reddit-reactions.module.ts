import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaExecutionsModule } from '../../area-executions/area-executions.module';
import { AreaParametersModule } from '../../area-parameters/area-parameters.module';
import { ServicesModule } from '../../services/services.module';
import { Area } from '../../areas/entities/area.entity';
import { RedditReactionsService } from './reddit-reactions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Area]),
    forwardRef(() => AreaExecutionsModule),
    forwardRef(() => AreaParametersModule),
    ServicesModule,
  ],
  providers: [RedditReactionsService],
  exports: [RedditReactionsService],
})
export class RedditReactionsModule {}
