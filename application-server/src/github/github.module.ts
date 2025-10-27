import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { Area } from '../areas/entities/area.entity';
import { HookStatesModule } from '../hook-states/hook-states.module';
import { AreaExecutionsModule } from '../area-executions/area-executions.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Area]),
    HookStatesModule,
    AreaExecutionsModule,
    CommonModule,
  ],
  controllers: [GithubController],
  providers: [GithubService],
  exports: [GithubService],
})
export class GithubModule {}
