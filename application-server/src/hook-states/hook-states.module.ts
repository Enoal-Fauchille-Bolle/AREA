import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HookStatesService } from './hook-states.service';
import { HookStatesController } from './hook-states.controller';
import { HookState } from './entities/hook-state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HookState])],
  controllers: [HookStatesController],
  providers: [HookStatesService],
  exports: [HookStatesService],
})
export class HookStatesModule {}