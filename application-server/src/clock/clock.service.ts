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

    this.logger.debug(`Checking timer triggers for time: ${currentTime}`);

    try {
      // Check daily timers
      const dailyAreas: import('../areas/entities/area.entity').Area[] =
        await this.areasService.findByActionComponent('daily_timer');
      for (const area of dailyAreas) {
        await this.checkDailyTimerArea(area, currentTime);
      }

      // Check weekly timers
      const weeklyAreas: import('../areas/entities/area.entity').Area[] =
        await this.areasService.findByActionComponent('weekly_timer');
      for (const area of weeklyAreas) {
        await this.checkWeeklyTimerArea(area, currentTime, now);
      }

      // Check monthly timers
      const monthlyAreas: import('../areas/entities/area.entity').Area[] =
        await this.areasService.findByActionComponent('monthly_timer');
      for (const area of monthlyAreas) {
        await this.checkMonthlyTimerArea(area, currentTime, now);
      }

      // Check interval timers
      const intervalAreas: import('../areas/entities/area.entity').Area[] =
        await this.areasService.findByActionComponent('interval_timer');
      for (const area of intervalAreas) {
        await this.checkIntervalTimerArea(area, now);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing timers: ${errorMessage}`, errorStack);
    }
  }

  private async checkDailyTimerArea(
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

  private async checkWeeklyTimerArea(
    area: import('../areas/entities/area.entity').Area,
    currentTime: string,
    now: Date,
  ): Promise<void> {
    try {
      const areaParameters: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto[] =
        await this.areaParametersService.findByArea(area.id);

      const timeParam = areaParameters.find(
        (
          p: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto,
        ) => p.variable?.name === 'time',
      );
      const daysParam = areaParameters.find(
        (
          p: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto,
        ) => p.variable?.name === 'days_of_week',
      );

      if (!timeParam?.value || !daysParam?.value) {
        this.logger.warn(`Area ${area.id} missing weekly timer parameters`);
        return;
      }

      const targetTime = timeParam.value;
      const targetDays = daysParam.value
        .toLowerCase()
        .split(',')
        .map((d) => d.trim());
      const currentDay = now
        .toLocaleDateString('en', { weekday: 'long' })
        .toLowerCase();

      // Check if today is one of the target days and time matches
      if (targetDays.includes(currentDay) && currentTime === targetTime) {
        const stateKey = `weekly_timer_${area.id}_${this.getDateKey(now)}`;
        const existingState = await this.hookStatesService.getState(
          area.id,
          stateKey,
        );

        if (existingState) {
          this.logger.debug(
            `Weekly timer already triggered today for area ${area.id}`,
          );
          return;
        }

        await this.triggerTimerArea(area, now, 'weekly_timer');
        await this.hookStatesService.setState(
          area.id,
          stateKey,
          'triggered',
          now,
        );
        this.logger.log(
          `Successfully triggered area ${area.id} with weekly timer`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing weekly timer area ${area.id}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async checkMonthlyTimerArea(
    area: import('../areas/entities/area.entity').Area,
    currentTime: string,
    now: Date,
  ): Promise<void> {
    try {
      const areaParameters: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto[] =
        await this.areaParametersService.findByArea(area.id);

      const timeParam = areaParameters.find(
        (
          p: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto,
        ) => p.variable?.name === 'time',
      );
      const daysParam = areaParameters.find(
        (
          p: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto,
        ) => p.variable?.name === 'days_of_month',
      );

      if (!timeParam?.value || !daysParam?.value) {
        this.logger.warn(`Area ${area.id} missing monthly timer parameters`);
        return;
      }

      const targetTime = timeParam.value;
      const targetDays = daysParam.value.split(',').map((d) => d.trim());
      const currentDayOfMonth = now.getDate().toString();
      const isLastDay = this.isLastDayOfMonth(now);

      // Check if today matches one of the target days
      const shouldTrigger = targetDays.some((day) => {
        if (day === 'last') return isLastDay;
        return day === currentDayOfMonth;
      });

      if (shouldTrigger && currentTime === targetTime) {
        const stateKey = `monthly_timer_${area.id}_${this.getDateKey(now)}`;
        const existingState = await this.hookStatesService.getState(
          area.id,
          stateKey,
        );

        if (existingState) {
          this.logger.debug(
            `Monthly timer already triggered today for area ${area.id}`,
          );
          return;
        }

        await this.triggerTimerArea(area, now, 'monthly_timer');
        await this.hookStatesService.setState(
          area.id,
          stateKey,
          'triggered',
          now,
        );
        this.logger.log(
          `Successfully triggered area ${area.id} with monthly timer`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing monthly timer area ${area.id}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async checkIntervalTimerArea(
    area: import('../areas/entities/area.entity').Area,
    now: Date,
  ): Promise<void> {
    try {
      const areaParameters: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto[] =
        await this.areaParametersService.findByArea(area.id);

      // Check for new flexible interval parameters first
      const intervalUnitParam = areaParameters.find(
        (
          p: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto,
        ) => p.variable?.name === 'interval_unit',
      );
      const intervalValueParam = areaParameters.find(
        (
          p: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto,
        ) => p.variable?.name === 'interval_value',
      );
      const startTimeParam = areaParameters.find(
        (
          p: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto,
        ) => p.variable?.name === 'start_time',
      );

      // Fallback to legacy interval_minutes for backward compatibility
      const legacyIntervalParam = areaParameters.find(
        (
          p: import('../area-parameters/dto/area-parameter-response.dto').AreaParameterResponseDto,
        ) => p.variable?.name === 'interval_minutes',
      );

      let intervalMinutes: number;
      let startTime: string;

      // Use new flexible system if available
      if (
        intervalUnitParam?.value &&
        intervalValueParam?.value &&
        startTimeParam?.value
      ) {
        const unit = intervalUnitParam.value.toLowerCase();
        const value = parseInt(intervalValueParam.value);
        startTime = startTimeParam.value;

        // Convert to minutes based on unit
        switch (unit) {
          case 'minutes':
            intervalMinutes = value;
            break;
          case 'hours':
            intervalMinutes = value * 60;
            break;
          case 'days':
            intervalMinutes = value * 60 * 24;
            break;
          default:
            this.logger.warn(
              `Area ${area.id} has invalid interval unit: ${unit}`,
            );
            return;
        }
      }
      // Fallback to legacy system
      else if (legacyIntervalParam?.value && startTimeParam?.value) {
        intervalMinutes = parseInt(legacyIntervalParam.value);
        startTime = startTimeParam.value;
      } else {
        this.logger.warn(`Area ${area.id} missing interval timer parameters`);
        return;
      }

      if (
        await this.shouldTriggerInterval(
          area.id,
          intervalMinutes,
          startTime,
          now,
        )
      ) {
        await this.triggerTimerArea(area, now, 'interval_timer');

        // Update state with current trigger time
        const stateKey = `interval_timer_${area.id}`;
        await this.hookStatesService.setState(
          area.id,
          stateKey,
          now.toISOString(),
          now,
        );
        this.logger.log(
          `Successfully triggered area ${area.id} with interval timer`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing interval timer area ${area.id}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async shouldTriggerInterval(
    areaId: number,
    intervalMinutes: number,
    startTime: string,
    now: Date,
  ): Promise<boolean> {
    // Get the last trigger time for this area
    const stateKey = `interval_timer_${areaId}`;
    const lastTriggerState = await this.hookStatesService.getState(
      areaId,
      stateKey,
    );

    // Parse start time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const todayStart = new Date(now);
    todayStart.setHours(startHour, startMinute, 0, 0);

    // If before start time today, don't trigger
    if (now < todayStart) {
      return false;
    }

    // Calculate next trigger time
    let nextTrigger: Date;

    if (!lastTriggerState) {
      // First trigger - use start time
      nextTrigger = todayStart;
    } else {
      // Calculate next trigger based on last trigger + interval
      const lastTrigger = new Date(lastTriggerState);
      nextTrigger = new Date(lastTrigger.getTime() + intervalMinutes * 60000);
    }

    // Should trigger if current time >= next trigger time
    return now >= nextTrigger;
  }

  private async triggerTimerArea(
    area: import('../areas/entities/area.entity').Area,
    now: Date,
    timerType: string,
  ): Promise<void> {
    // Create area execution
    const execution = await this.areaExecutionsService.create({
      areaId: area.id,
      status: ExecutionStatus.PENDING,
      triggerData: {
        triggerType: timerType,
        triggerTime: now.toISOString(),
      },
      startedAt: now,
    });

    // Trigger the reaction
    await this.reactionProcessorService.processReaction(
      area.component_reaction_id,
      execution.id,
      area.id,
    );
  }

  private isLastDayOfMonth(date: Date): boolean {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    return nextDay.getDate() === 1;
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  }
}
