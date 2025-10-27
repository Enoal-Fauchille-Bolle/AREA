import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaParametersService } from './area-parameters.service';
import { AreaParametersController } from './area-parameters.controller';
import { AreaParameter } from './entities/area-parameter.entity';
import { VariableInterpolationService } from '../common/variable-interpolation.service';

@Module({
  imports: [TypeOrmModule.forFeature([AreaParameter])],
  controllers: [AreaParametersController],
  providers: [AreaParametersService, VariableInterpolationService],
  exports: [AreaParametersService],
})
export class AreaParametersModule {}
