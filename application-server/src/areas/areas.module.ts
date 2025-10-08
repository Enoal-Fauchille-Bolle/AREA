import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { Area } from './entities/area.entity';
import { VariablesModule } from '../variables/variables.module';
import { AreaParametersModule } from '../area-parameters/area-parameters.module';
import { ComponentsModule } from '../components/components.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Area]),
    VariablesModule,
    AreaParametersModule,
    ComponentsModule,
  ],
  controllers: [AreasController],
  providers: [AreasService],
  exports: [AreasService],
})
export class AreasModule {}
