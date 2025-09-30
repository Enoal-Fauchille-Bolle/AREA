import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaParametersService } from './area-parameters.service';
import { AreaParametersController } from './area-parameters.controller';
import { AreaParameter } from './entities/area-parameter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AreaParameter])],
  controllers: [AreaParametersController],
  providers: [AreaParametersService],
  exports: [AreaParametersService],
})
export class AreaParametersModule {}