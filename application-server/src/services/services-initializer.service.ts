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
    await this.createGoogleService();
    await this.createGithubService();
    await this.createGmailService();
    await this.createTwitchService();
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

  private async createGoogleService(): Promise<void> {
    try {
      await this.servicesService.findByName('Google');
      console.log('Google service already exists, skipping creation');
      return;
    } catch {
      console.log('Creating Google service...');
    }

    await this.servicesService.create({
      name: 'Google',
      description: 'Google OAuth2 integration for authentication and services',
      icon_path:
        'https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png',
      requires_auth: true,
      is_active: true,
    });

    console.log('Google service created successfully');
  }

  private async createGithubService(): Promise<void> {
    try {
      // Check if GitHub service already exists
      await this.servicesService.findByName('GitHub');
      console.log('GitHub service already exists, skipping creation');
      return;
    } catch {
      // Service doesn't exist, create it
      console.log('Creating GitHub service...');
    }

    // Create GitHub service
    await this.servicesService.create({
      name: 'GitHub',
      description: 'Source code hosting and collaboration platform',
      icon_path:
        'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
      requires_auth: true,
      is_active: true,
    });

    console.log('GitHub service created successfully');
  }

  private async createGmailService(): Promise<void> {
    try {
      await this.servicesService.findByName('Gmail');
      console.log('Gmail service already exists, skipping creation');
      return;
    } catch {
      console.log('Creating Gmail service...');
    }

    const gmailService = await this.servicesService.create({
      name: 'Gmail',
      description: 'Send and receive emails using your Gmail account',
      icon_path:
        'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r5.png',
      requires_auth: true,
      is_active: true,
    });

    // Create new_email_received action component
    const newEmailAction = await this.componentsService.create({
      service_id: gmailService.id,
      type: ComponentType.ACTION,
      name: 'new_email_received',
      description: 'Triggers when a new email is received in Gmail',
      is_active: true,
      polling_interval: 120000, // Check every 2 minutes
    });

    await Promise.all([
      // Optional filter: from email
      this.variablesService.create({
        component_id: newEmailAction.id,
        name: 'from',
        description: 'Filter emails from specific sender (optional)',
        kind: VariableKind.PARAMETER,
        type: VariableType.EMAIL,
        nullable: true,
        placeholder: 'sender@example.com',
        validation_regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        display_order: 1,
      }),

      // Optional filter: subject contains
      this.variablesService.create({
        component_id: newEmailAction.id,
        name: 'subject_contains',
        description: 'Filter emails by subject keyword (optional)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'Important',
        display_order: 2,
      }),

      // Return value: email ID
      this.variablesService.create({
        component_id: newEmailAction.id,
        name: 'email_id',
        description: 'ID of the received email',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      // Return value: from address
      this.variablesService.create({
        component_id: newEmailAction.id,
        name: 'from',
        description: 'Sender email address',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.EMAIL,
        nullable: false,
        display_order: 2,
      }),

      // Return value: subject
      this.variablesService.create({
        component_id: newEmailAction.id,
        name: 'subject',
        description: 'Email subject',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 3,
      }),

      // Return value: snippet
      this.variablesService.create({
        component_id: newEmailAction.id,
        name: 'snippet',
        description: 'Email preview snippet',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 4,
      }),
    ]);

    // Create send_gmail reaction component
    const sendGmailReaction = await this.componentsService.create({
      service_id: gmailService.id,
      type: ComponentType.REACTION,
      name: 'send_gmail',
      description: 'Send an email via Gmail',
      is_active: true,
    });

    await Promise.all([
      // To address - required
      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'to',
        description: 'Recipient email address',
        kind: VariableKind.PARAMETER,
        type: VariableType.EMAIL,
        nullable: false,
        placeholder: 'recipient@example.com',
        validation_regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        display_order: 1,
      }),

      // Subject - required
      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'subject',
        description: 'Email subject',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: 'AREA Notification',
        display_order: 2,
      }),

      // Body - required
      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'body',
        description: 'Email body content',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: 'Your automation was triggered.',
        display_order: 3,
      }),

      // CC - optional
      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'cc',
        description: 'CC email addresses (optional, comma-separated)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'cc@example.com',
        display_order: 4,
      }),

      // BCC - optional
      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'bcc',
        description: 'BCC email addresses (optional, comma-separated)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'bcc@example.com',
        display_order: 5,
      }),

      // Return value: message ID
      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'message_id',
        description: 'ID of the sent email',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      // Return value: thread ID
      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'thread_id',
        description: 'Thread ID of the sent email',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),
    ]);

    console.log(
      'Gmail service with new_email_received action and send_gmail reaction created successfully',
    );
  }

  private async createTwitchService(): Promise<void> {
    try {
      await this.servicesService.findByName('Twitch');
      console.log('Twitch service already exists, skipping creation');
      return;
    } catch {
      console.log('Creating Twitch service...');
    }

    const twitchService = await this.servicesService.create({
      name: 'Twitch',
      description:
        'Monitor Twitch streams and interact with Twitch chat channels',
      icon_path:
        'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png',
      requires_auth: true,
      is_active: true,
    });

    // Create streamer_goes_live action component
    const streamerGoesLiveAction = await this.componentsService.create({
      service_id: twitchService.id,
      type: ComponentType.ACTION,
      name: 'streamer_goes_live',
      description: 'Triggers when a specified Twitch streamer goes live',
      is_active: true,
      polling_interval: 30000, // Check every 30 seconds
    });

    await Promise.all([
      // Streamer username parameter - required
      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'streamer_username',
        description: 'Twitch username of the streamer to monitor',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: 'ninja',
        display_order: 1,
      }),

      // Return value: streamer ID
      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'streamer_id',
        description: 'Twitch user ID of the streamer',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      // Return value: streamer username
      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'streamer_username',
        description: 'Twitch username of the streamer',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

      // Return value: stream title
      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'stream_title',
        description: 'Title of the stream',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 3,
      }),

      // Return value: game name
      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'game_name',
        description: 'Name of the game being played',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 4,
      }),

      // Return value: viewer count
      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'viewer_count',
        description: 'Current number of viewers',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.NUMBER,
        nullable: false,
        display_order: 5,
      }),

      // Return value: started at
      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'started_at',
        description: 'Timestamp when the stream started',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.DATE,
        nullable: false,
        display_order: 6,
      }),
    ]);

    // Create send_chat_message reaction component
    const sendChatMessageReaction = await this.componentsService.create({
      service_id: twitchService.id,
      type: ComponentType.REACTION,
      name: 'send_chat_message',
      description: 'Send a message to a Twitch chat channel',
      is_active: true,
    });

    await Promise.all([
      // Broadcaster username - required
      this.variablesService.create({
        component_id: sendChatMessageReaction.id,
        name: 'broadcaster_username',
        description: 'Twitch username of the channel to send message to',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: 'ninja',
        display_order: 1,
      }),

      // Message - required
      this.variablesService.create({
        component_id: sendChatMessageReaction.id,
        name: 'message',
        description: 'Message content to send in chat',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: 'Hello from AREA! 👋',
        display_order: 2,
      }),

      // Return value: broadcaster ID
      this.variablesService.create({
        component_id: sendChatMessageReaction.id,
        name: 'broadcaster_id',
        description: 'Twitch user ID of the broadcaster',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      // Return value: broadcaster username
      this.variablesService.create({
        component_id: sendChatMessageReaction.id,
        name: 'broadcaster_username',
        description: 'Twitch username of the broadcaster',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

      // Return value: sent at
      this.variablesService.create({
        component_id: sendChatMessageReaction.id,
        name: 'sent_at',
        description: 'Timestamp when the message was sent',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.DATE,
        nullable: false,
        display_order: 3,
      }),
    ]);

    console.log(
      'Twitch service with streamer_goes_live action and send_chat_message reaction created successfully',
    );
  }
}
