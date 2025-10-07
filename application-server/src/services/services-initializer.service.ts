import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ComponentsService } from '../components/components.service';
import { ComponentType } from '../components/entities/component.entity';
import { VariablesService } from '../variables/variables.service';
import {
  VariableKind,
  VariableType,
} from '../variables/entities/variable.entity';

@Injectable()
export class ServicesInitializerService implements OnApplicationBootstrap {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly componentsService: ComponentsService,
    private readonly variablesService: VariablesService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.initializeDefaultServices();
  }

  private async initializeDefaultServices(): Promise<void> {
    await this.createClockService();
    await this.createEmailService();
  }

  private async createClockService(): Promise<void> {
    try {
      await this.servicesService.findByName('Clock');
      console.log('Clock service already exists, skipping creation');
      return;
    } catch {
      console.log('Creating Clock service...');
    }

    const clockService = await this.servicesService.create({
      name: 'Clock',
      description: 'Time-based triggers and actions for automation workflows',
      icon_path: 'https://unpkg.com/heroicons@2.0.18/24/outline/clock.svg',
      requires_auth: false,
      is_active: true,
    });

    const dailyTimerComponent = await this.componentsService.create({
      service_id: clockService.id,
      type: ComponentType.ACTION,
      name: 'daily_timer',
      description: 'Triggers at the same time every day',
      is_active: true,
      polling_interval: 60000,
    });

    await this.variablesService.create({
      component_id: dailyTimerComponent.id,
      name: 'time',
      description: 'Time of day to trigger (HH:MM format, 24-hour)',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: false,
      placeholder: '09:30',
      validation_regex: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
      display_order: 1,
    });

    const weeklyTimerComponent = await this.componentsService.create({
      service_id: clockService.id,
      type: ComponentType.ACTION,
      name: 'weekly_timer',
      description: 'Triggers at a specific time on specific days of the week',
      is_active: true,
      polling_interval: 60000,
    });

    await this.variablesService.create({
      component_id: weeklyTimerComponent.id,
      name: 'time',
      description: 'Time of day to trigger (HH:MM format, 24-hour)',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: false,
      placeholder: '09:30',
      validation_regex: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
      display_order: 1,
    });

    await this.variablesService.create({
      component_id: weeklyTimerComponent.id,
      name: 'days_of_week',
      description:
        'Days of week to trigger (comma-separated: monday,tuesday,wednesday,thursday,friday,saturday,sunday)',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: false,
      placeholder: 'monday,friday',
      display_order: 2,
    });

    const monthlyTimerComponent = await this.componentsService.create({
      service_id: clockService.id,
      type: ComponentType.ACTION,
      name: 'monthly_timer',
      description: 'Triggers at a specific time on specific days of the month',
      is_active: true,
      polling_interval: 60000,
    });

    await this.variablesService.create({
      component_id: monthlyTimerComponent.id,
      name: 'time',
      description: 'Time of day to trigger (HH:MM format, 24-hour)',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: false,
      placeholder: '09:30',
      validation_regex: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
      display_order: 1,
    });

    await this.variablesService.create({
      component_id: monthlyTimerComponent.id,
      name: 'days_of_month',
      description:
        'Days of month to trigger (comma-separated: 1,15,30 or "last" for last day)',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: false,
      placeholder: '1,15',
      display_order: 2,
    });

    const intervalTimerComponent = await this.componentsService.create({
      service_id: clockService.id,
      type: ComponentType.ACTION,
      name: 'interval_timer',
      description: 'Triggers at regular intervals',
      is_active: true,
      polling_interval: 60000,
    });

    await this.variablesService.create({
      component_id: intervalTimerComponent.id,
      name: 'interval_minutes',
      description: 'Interval in minutes between triggers',
      kind: VariableKind.PARAMETER,
      type: VariableType.NUMBER,
      nullable: false,
      placeholder: '30',
      display_order: 1,
    });

    await this.variablesService.create({
      component_id: intervalTimerComponent.id,
      name: 'start_time',
      description: 'Time to start the interval (HH:MM format, 24-hour)',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: false,
      placeholder: '09:00',
      validation_regex: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
      display_order: 2,
    });

    console.log('Clock service with all timer components created successfully');
  }

  private async createEmailService(): Promise<void> {
    try {
      await this.servicesService.findByName('Email');
      console.log('Email service already exists, skipping creation');
      return;
    } catch {
      console.log('Creating Email service...');
    }

    const emailService = await this.servicesService.create({
      name: 'Email',
      description: 'Send email notifications and messages',
      icon_path: 'https://unpkg.com/heroicons@2.0.18/24/outline/envelope.svg',
      requires_auth: false,
      is_active: true,
    });

    const sendEmailComponent = await this.componentsService.create({
      service_id: emailService.id,
      type: ComponentType.REACTION,
      name: 'send_email',
      description: 'Send an email to specified recipient',
      is_active: true,
    });

    await Promise.all([
      this.variablesService.create({
        component_id: sendEmailComponent.id,
        name: 'to',
        description: 'Recipient email address',
        kind: VariableKind.PARAMETER,
        type: VariableType.EMAIL,
        nullable: false,
        placeholder: 'user@example.com',
        validation_regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        display_order: 1,
      }),

      this.variablesService.create({
        component_id: sendEmailComponent.id,
        name: 'subject',
        description: 'Email subject line',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'AREA Notification',
        display_order: 2,
      }),

      this.variablesService.create({
        component_id: sendEmailComponent.id,
        name: 'body',
        description: 'Email message body',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'Your AREA was triggered successfully.',
        display_order: 3,
      }),
    ]);

    console.log('Email service and send_email component created successfully');
  }
}
