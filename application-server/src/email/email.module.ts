import { Module } from '@nestjs/common';
import { FakeEmailService } from './email.service';
import { RealEmailService } from './real-email.service';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';

@Module({
  imports: [AreaExecutionsModule, AreaParametersModule],
  providers: [FakeEmailService, RealEmailService],
  exports: [FakeEmailService, RealEmailService],
})
export class EmailModule {}
