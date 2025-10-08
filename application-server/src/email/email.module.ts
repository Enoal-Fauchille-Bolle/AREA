import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';

@Module({
  imports: [AreaExecutionsModule, AreaParametersModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
