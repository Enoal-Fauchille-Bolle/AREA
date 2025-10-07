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
      // Check if Clock service already exists
      await this.servicesService.findByName('Clock');
      console.log('Clock service already exists, skipping creation');
      return;
    } catch {
      // Service doesn't exist, create it
      console.log('Creating Clock service...');
    }

    // Create Clock service
    const clockService = await this.servicesService.create({
      name: 'Clock',
      description: 'Time-based triggers and actions for automation workflows',
      icon_path: '/icons/clock.svg',
      requires_auth: false,
      is_active: true,
    });

    // Create Timer action component
    const timerComponent = await this.componentsService.create({
      service_id: clockService.id,
      type: ComponentType.ACTION,
      name: 'daily_timer',
      description: 'Triggers at the same time every day',
      is_active: true,
      polling_interval: 60000, // Check every minute (60 seconds)
    });

    // Create the time parameter variable for the timer component
    await this.variablesService.create({
      component_id: timerComponent.id,
      name: 'time',
      description: 'Time of day to trigger (HH:MM format, 24-hour)',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: false,
      placeholder: '09:30',
      validation_regex: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
      display_order: 1,
    });

    console.log('Clock service and Timer component created successfully');
  }

  private async createEmailService(): Promise<void> {
    try {
      // Check if Email service already exists
      await this.servicesService.findByName('Email');
      console.log('Email service already exists, skipping creation');
      return;
    } catch {
      // Service doesn't exist, create it
      console.log('Creating Email service...');
    }

    // Create Email service
    const emailService = await this.servicesService.create({
      name: 'Email',
      description: 'Send email notifications and messages',
      icon_path: '/icons/email.svg',
      requires_auth: false, // For now, no OAuth - can be changed later to support Gmail API
      is_active: true,
    });

    // Create send_email reaction component
    const sendEmailComponent = await this.componentsService.create({
      service_id: emailService.id,
      type: ComponentType.REACTION,
      name: 'send_email',
      description: 'Send an email to specified recipient',
      is_active: true,
      // polling_interval not needed for reactions
    });

    // Create email parameter variables
    await Promise.all([
      // To (recipient email) - required
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

      // Subject - optional with default
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

      // Body - optional with default
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
