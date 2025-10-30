import { Module, forwardRef } from '@nestjs/common';
import { AreaExecutionsModule } from '../../area-executions/area-executions.module';
import { AreaParametersModule } from '../../area-parameters/area-parameters.module';
import { RedditReactionsService } from './reddit-reactions.service';

@Module({
  imports: [
    forwardRef(() => AreaExecutionsModule),
    forwardRef(() => AreaParametersModule),
  ],
  providers: [RedditReactionsService],
  exports: [RedditReactionsService],
})
export class RedditReactionsModule {}
