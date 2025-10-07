import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HookStatesService } from '../hook-states/hook-states.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreasService } from '../areas/areas.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { ExecutionStatus } from '../area-executions/entities/area-execution.entity';
import { ReactionProcessorService } from '../common/reaction-processor.service';

@Injectable()
export class ClockService {
  private readonly logger = new Logger(ClockService.name);

  constructor(
    private readonly hookStatesService: HookStatesService,
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areasService: AreasService,
    private readonly areaParametersService: AreaParametersService,
    private readonly reactionProcessorService: ReactionProcessorService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTimerTriggers(): Promise<void> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.logger.debug(`Checking daily timer triggers for time: ${currentTime}`);

    try {
      // Find all active areas that use the daily_timer action
      const timerAreas: import('../areas/entities/area.entity').Area[] =
        await this.areasService.findByActionComponent('daily_timer');

      for (const area of timerAreas) {
        await this.checkTimerArea(area, currentTime);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing daily timer: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async checkTimerArea(
    area: import('../areas/entities/area.entity').Area,
    currentTime: string,
  ): Promise<void> {
    try {
      // Get the configured time from area parameters
      const areaParameters: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto[] =
        await this.areaParametersService.findByArea(area.id);
      const timeParam = areaParameters.find(
        (
          p: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto,
        ) => p.variable?.name === 'time',
      );

      if (!timeParam?.value) {
        this.logger.warn(`Area ${area.id} has no time parameter configured`);
        return;
      }

      const targetTime = timeParam.value;

      if (currentTime === targetTime) {
        // Check if we already triggered today
        const stateKey = `daily_timer_${area.id}_${this.getDateKey(new Date())}`;
        const existingState = await this.hookStatesService.getState(
          area.id,
          stateKey,
        );

        if (existingState) {
          this.logger.debug(
            `Timer already triggered today for area ${area.id}`,
          );
          return;
        }

        this.logger.log(
          `Triggering daily timer for area ${area.id} at ${currentTime}`,
        );

        const execution = await this.areaExecutionsService.create({
          areaId: area.id,
          triggerData: {
            time: currentTime,
            date: new Date().toISOString(),
            triggered_by: 'daily_timer',
          },
          status: ExecutionStatus.PENDING,
          startedAt: new Date(),
        });

        // Mark execution as started
        await this.areaExecutionsService.startExecution(execution.id);

        await this.reactionProcessorService.processReaction(
          area.component_reaction_id,
          execution.id,
          area.id,
        );

        // Mark as triggered for today
        await this.hookStatesService.setState(
          area.id,
          stateKey,
          'triggered',
          new Date(),
        );

        this.logger.log(
          `Successfully triggered area ${area.id} with daily timer`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing timer area ${area.id}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  }
}
