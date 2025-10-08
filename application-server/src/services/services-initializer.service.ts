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
    await this.createDiscordService();
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

    // Create Daily Timer action component
    const dailyTimerComponent = await this.componentsService.create({
      service_id: clockService.id,
      type: ComponentType.ACTION,
      name: 'daily_timer',
      description: 'Triggers at the same time every day',
      is_active: true,
      polling_interval: 60000, // Check every minute (60 seconds)
    });

    // Create the time parameter variable for the daily timer component
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

    // Create Weekly Timer action component
    const weeklyTimerComponent = await this.componentsService.create({
      service_id: clockService.id,
      type: ComponentType.ACTION,
      name: 'weekly_timer',
      description: 'Triggers at a specific time on specific days of the week',
      is_active: true,
      polling_interval: 60000,
    });

    // Create time parameter for weekly timer
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

    // Create days_of_week parameter for weekly timer
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

    // Create Monthly Timer action component
    const monthlyTimerComponent = await this.componentsService.create({
      service_id: clockService.id,
      type: ComponentType.ACTION,
      name: 'monthly_timer',
      description: 'Triggers at a specific time on specific days of the month',
      is_active: true,
      polling_interval: 60000,
    });

    // Create time parameter for monthly timer
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

    // Create days_of_month parameter for monthly timer
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

    // Create Interval Timer action component
    const intervalTimerComponent = await this.componentsService.create({
      service_id: clockService.id,
      type: ComponentType.ACTION,
      name: 'interval_timer',
      description: 'Triggers at regular intervals',
      is_active: true,
      polling_interval: 60000,
    });

    // Create interval_minutes parameter
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

    // Create start_time parameter for interval timer
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

  private async createDiscordService(): Promise<void> {
    try {
      // Check if Discord service already exists
      await this.servicesService.findByName('Discord');
      console.log('Discord service already exists, skipping creation');
      return;
    } catch {
      // Service doesn't exist, create it
      console.log('Creating Discord service...');
    }

    // Create Discord service
    const discordService = await this.servicesService.create({
      name: 'Discord',
      description:
        'Send messages and interact with Discord servers and channels',
      icon_path: '/icons/discord.svg',
      requires_auth: true, // Discord requires OAuth2
      is_active: true,
    });

    // Create send_message reaction component
    const sendMessageComponent = await this.componentsService.create({
      service_id: discordService.id,
      type: ComponentType.REACTION,
      name: 'send_message',
      description: 'Send a message to a Discord channel',
      is_active: true,
      // polling_interval not needed for reactions
    });

    // Create component parameters
    await Promise.all([
      // Channel ID parameter - required
      this.variablesService.create({
        component_id: sendMessageComponent.id,
        name: 'channel_id',
        description: 'Discord channel ID where the message will be sent',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: '123456789012345678',
        validation_regex: '^[0-9]{17,19}$', // Discord snowflake ID pattern
        display_order: 1,
      }),

      // Message content parameter - required
      this.variablesService.create({
        component_id: sendMessageComponent.id,
        name: 'content',
        description: 'Message content to send (supports Discord markdown)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: 'Hello from AREA! 👋',
        display_order: 2,
      }),

      // Embed title parameter - optional
      this.variablesService.create({
        component_id: sendMessageComponent.id,
        name: 'embed_title',
        description: 'Optional embed title for rich message formatting',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'AREA Notification',
        display_order: 3,
      }),

      // Embed description parameter - optional
      this.variablesService.create({
        component_id: sendMessageComponent.id,
        name: 'embed_description',
        description: 'Optional embed description for rich message formatting',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'Your automation was triggered successfully',
        display_order: 4,
      }),

      // Embed color parameter - optional
      this.variablesService.create({
        component_id: sendMessageComponent.id,
        name: 'embed_color',
        description: 'Optional embed color in hexadecimal format (without #)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: '5865F2',
        validation_regex: '^[0-9A-Fa-f]{6}$', // Hex color without #
        display_order: 5,
      }),
    ]);

    // Create return values for the component
    await Promise.all([
      // Message ID return value
      this.variablesService.create({
        component_id: sendMessageComponent.id,
        name: 'message_id',
        description: 'ID of the sent Discord message',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      // Message URL return value
      this.variablesService.create({
        component_id: sendMessageComponent.id,
        name: 'message_url',
        description: 'Direct URL to the sent Discord message',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.URL,
        nullable: false,
        display_order: 2,
      }),

      // Timestamp return value
      this.variablesService.create({
        component_id: sendMessageComponent.id,
        name: 'sent_at',
        description: 'Timestamp when the message was sent',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.DATE,
        nullable: false,
        display_order: 3,
      }),
    ]);

    console.log(
      'Discord service and send_message component created successfully',
    );
  }
}
