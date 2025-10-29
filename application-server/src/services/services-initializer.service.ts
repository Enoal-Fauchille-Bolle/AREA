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
    await this.createYoutubeService();
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
      await this.servicesService.findByName('Discord');
      console.log('Discord service already exists, skipping creation');
      return;
    } catch {
      console.log('Creating Discord service...');
    }

    const discordService = await this.servicesService.create({
      name: 'Discord',
      description:
        'Send messages to Discord channels using the AREA Discord Bot. The bot must be added to your server with appropriate permissions.',
      icon_path:
        'https://static.vecteezy.com/system/resources/previews/023/741/147/non_2x/discord-logo-icon-social-media-icon-free-png.png',
      requires_auth: true,
      is_active: true,
    });

    const sendMessageComponent = await this.componentsService.create({
      service_id: discordService.id,
      type: ComponentType.REACTION,
      name: 'send_message',
      description:
        'Send a message to a Discord channel using the AREA Discord Bot',
      is_active: true,
    });

    // Create message_posted action component
    const messagePostedComponent = await this.componentsService.create({
      service_id: discordService.id,
      type: ComponentType.ACTION,
      name: 'message_posted',
      description: 'Triggers when a new message is posted in a Discord channel',
      is_active: true,
    });

    // Create component parameters for send_message
    await Promise.all([
      this.variablesService.create({
        component_id: sendMessageComponent.id,
        name: 'channel_id',
        description:
          'Discord channel ID where the message will be sent. The AREA bot must have access to this channel.',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: '123456789012345678',
        validation_regex: '^[0-9]{17,19}$',
        display_order: 1,
      }),

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
    ]);

    // Create component parameters for message_posted
    await Promise.all([
      // Channel ID parameter - required
      this.variablesService.create({
        component_id: messagePostedComponent.id,
        name: 'channel_id',
        description:
          'Discord channel ID to monitor for new messages. The AREA bot must have access to this channel.',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: '123456789012345678',
        validation_regex: '^[0-9]{17,19}$', // Discord snowflake ID pattern
        display_order: 1,
      }),

      // Author filter parameter - optional
      this.variablesService.create({
        component_id: messagePostedComponent.id,
        name: 'author_filter',
        description:
          'Filter messages by author username (optional, case-insensitive)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'username',
        display_order: 2,
      }),

      // Content filter parameter - optional
      this.variablesService.create({
        component_id: messagePostedComponent.id,
        name: 'content_filter',
        description:
          'Filter messages containing this text (optional, case-insensitive)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'hello',
        display_order: 3,
      }),
    ]);

    // Create return values for message_posted
    await Promise.all([
      // Author name return value
      this.variablesService.create({
        component_id: messagePostedComponent.id,
        name: 'author_name',
        description: 'Username of the message author',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      // Author ID return value
      this.variablesService.create({
        component_id: messagePostedComponent.id,
        name: 'author_id',
        description: 'Discord user ID of the message author',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

      // Message content return value
      this.variablesService.create({
        component_id: messagePostedComponent.id,
        name: 'message_content',
        description: 'Content of the posted message',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 3,
      }),

      // Message ID return value
      this.variablesService.create({
        component_id: messagePostedComponent.id,
        name: 'message_id',
        description: 'Discord message ID of the posted message',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 4,
      }),

      // Current time return value
      this.variablesService.create({
        component_id: messagePostedComponent.id,
        name: 'current_time',
        description: 'Timestamp when the message was posted (ISO format)',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 5,
      }),
    ]);

    // Create react_to_message reaction component
    const reactToMessageComponent = await this.componentsService.create({
      service_id: discordService.id,
      type: ComponentType.REACTION,
      name: 'react_to_message',
      description: 'React to a Discord message with an emoji',
      is_active: true,
    });

    // Create reaction_added action component
    const reactionAddedComponent = await this.componentsService.create({
      service_id: discordService.id,
      type: ComponentType.ACTION,
      name: 'reaction_added',
      description: 'Triggers when a reaction is added to a Discord message',
      is_active: true,
    });

    // Create component parameters for react_to_message
    await Promise.all([
      // Channel ID parameter - required
      this.variablesService.create({
        component_id: reactToMessageComponent.id,
        name: 'channel_id',
        description:
          'Discord channel ID where the message is located. The AREA bot must have access to this channel.',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: '123456789012345678',
        validation_regex: '^[0-9]{17,19}$', // Discord snowflake ID pattern
        display_order: 1,
      }),

      // Message ID parameter - required
      this.variablesService.create({
        component_id: reactToMessageComponent.id,
        name: 'message_id',
        description: 'Discord message ID to react to',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: '123456789012345678',
        validation_regex: '^[0-9]{17,19}$', // Discord snowflake ID pattern
        display_order: 2,
      }),

      // Emoji parameter - required
      this.variablesService.create({
        component_id: reactToMessageComponent.id,
        name: 'emoji',
        description: 'Emoji to react with (Unicode emoji or custom emoji name)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: '👍',
        display_order: 3,
      }),
    ]);

    // Create component parameters for reaction_added
    await Promise.all([
      // Channel ID parameter - required
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'channel_id',
        description:
          'Discord channel ID to monitor for reactions. The AREA bot must have access to this channel.',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: '123456789012345678',
        validation_regex: '^[0-9]{17,19}$', // Discord snowflake ID pattern
        display_order: 1,
      }),

      // Message ID parameter - optional
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'message_id',
        description:
          'Specific message ID to monitor for reactions (optional, monitors all messages if not specified)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: '123456789012345678',
        validation_regex: '^[0-9]{17,19}$',
        display_order: 2,
      }),

      // Emoji filter parameter - optional
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'emoji_filter',
        description:
          'Filter reactions by emoji (optional, case-insensitive partial match)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: '👍',
        display_order: 3,
      }),

      // User filter parameter - optional
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'user_filter',
        description:
          'Filter reactions by username (optional, case-insensitive partial match)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'username',
        display_order: 4,
      }),
    ]);

    // Create return values for reaction_added
    await Promise.all([
      // User name return value
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'user_name',
        description: 'Username of the user who added the reaction',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      // User ID return value
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'user_id',
        description: 'Discord user ID of the user who added the reaction',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

      // Emoji name return value
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'emoji_name',
        description: 'Name or representation of the emoji used in the reaction',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 3,
      }),

      // Emoji ID return value
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'emoji_id',
        description:
          'Discord emoji ID (for custom emojis, null for Unicode emojis)',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: true,
        display_order: 4,
      }),

      // Message ID return value
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'message_id',
        description: 'Discord message ID that received the reaction',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 5,
      }),

      // Channel ID return value
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'channel_id',
        description: 'Discord channel ID where the reaction occurred',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 6,
      }),

      // Current time return value
      this.variablesService.create({
        component_id: reactionAddedComponent.id,
        name: 'current_time',
        description: 'Timestamp when the reaction was added (ISO format)',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 7,
      }),
    ]);

    console.log('Discord service with all components created successfully');
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
      description: 'Google OAuth authentication service',
      icon_path:
        'https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png',
      requires_auth: true,
      is_active: true,
    });

    console.log('Google service created successfully');
  }

  private async createGithubService(): Promise<void> {
    try {
      await this.servicesService.findByName('GitHub');
      console.log('GitHub service already exists, skipping creation');
      return;
    } catch {
      console.log('Creating GitHub service...');
    }

    // Create GitHub service
    const githubService = await this.servicesService.create({
      name: 'GitHub',
      description: 'Source code hosting and collaboration platform',
      icon_path:
        'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
      requires_auth: true,
      is_active: true,
    });

    // Create push_event action component
    const pushEventComponent = await this.componentsService.create({
      service_id: githubService.id,
      type: ComponentType.ACTION,
      name: 'push_event',
      description: 'Triggers when a push is made to a repository (any branch)',
      is_active: true,
      webhook_endpoint: '/webhooks/github',
    });

    // Create repository parameter for push_event
    await this.variablesService.create({
      component_id: pushEventComponent.id,
      name: 'repository',
      description:
        'Full repository name (owner/repo, e.g., "octocat/Hello-World"). Leave empty to match all repositories.',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: true,
      placeholder: 'octocat/Hello-World',
      display_order: 1,
    });

    // Create output variables for push_event
    await Promise.all([
      this.variablesService.create({
        component_id: pushEventComponent.id,
        name: 'head_commit_branch',
        description: 'Branch name where the push occurred',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      this.variablesService.create({
        component_id: pushEventComponent.id,
        name: 'head_commit_message',
        description: 'Commit message of the latest push',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

      this.variablesService.create({
        component_id: pushEventComponent.id,
        name: 'head_commit_date',
        description: 'Date and time when the commit was made',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.DATE,
        nullable: false,
        display_order: 3,
      }),

      this.variablesService.create({
        component_id: pushEventComponent.id,
        name: 'head_commit_url',
        description: 'Direct URL to the commit on GitHub',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.URL,
        nullable: false,
        display_order: 4,
      }),

      this.variablesService.create({
        component_id: pushEventComponent.id,
        name: 'head_commit_id',
        description: 'Full SHA hash of the commit',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 5,
      }),

      this.variablesService.create({
        component_id: pushEventComponent.id,
        name: 'head_commit_author_username',
        description: 'GitHub username of the commit author',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 6,
      }),

      this.variablesService.create({
        component_id: pushEventComponent.id,
        name: 'repository_name',
        description: 'Full repository name (owner/repo)',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 7,
      }),

      this.variablesService.create({
        component_id: pushEventComponent.id,
        name: 'pusher_name',
        description: 'Name of the person who pushed',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 8,
      }),

      this.variablesService.create({
        component_id: pushEventComponent.id,
        name: 'commits_count',
        description: 'Number of commits in this push',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.NUMBER,
        nullable: false,
        display_order: 9,
      }),
    ]);

    // Create pull_request_event action component
    const pullRequestEventComponent = await this.componentsService.create({
      service_id: githubService.id,
      type: ComponentType.ACTION,
      name: 'pull_request_event',
      description: 'Triggers when a new pull request is opened',
      is_active: true,
      webhook_endpoint: '/webhooks/github',
    });

    await this.variablesService.create({
      component_id: pullRequestEventComponent.id,
      name: 'repository',
      description:
        'Full repository name (owner/repo, e.g., "octocat/Hello-World"). Leave empty to match all repositories.',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: true,
      placeholder: 'octocat/Hello-World',
      display_order: 1,
    });

    // Create output variables for pull_request_event
    await Promise.all([
      this.variablesService.create({
        component_id: pullRequestEventComponent.id,
        name: 'pr_title',
        description: 'Title of the pull request',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      this.variablesService.create({
        component_id: pullRequestEventComponent.id,
        name: 'pr_body',
        description: 'Body/description of the pull request',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

      this.variablesService.create({
        component_id: pullRequestEventComponent.id,
        name: 'pr_link',
        description: 'Direct URL to the pull request on GitHub',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.URL,
        nullable: false,
        display_order: 3,
      }),

      this.variablesService.create({
        component_id: pullRequestEventComponent.id,
        name: 'pr_author_username',
        description: 'GitHub username of the pull request author',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 4,
      }),

      this.variablesService.create({
        component_id: pullRequestEventComponent.id,
        name: 'pr_head_branch',
        description: 'Source branch of the pull request',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 5,
      }),

      this.variablesService.create({
        component_id: pullRequestEventComponent.id,
        name: 'pr_base_branch',
        description: 'Target branch of the pull request',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 6,
      }),

      this.variablesService.create({
        component_id: pullRequestEventComponent.id,
        name: 'repository_name',
        description: 'Full repository name (owner/repo)',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 7,
      }),

      this.variablesService.create({
        component_id: pullRequestEventComponent.id,
        name: 'pr_number',
        description: 'Pull request number',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.NUMBER,
        nullable: false,
        display_order: 8,
      }),
    ]);

    // Create issue_event action component
    const issueEventComponent = await this.componentsService.create({
      service_id: githubService.id,
      type: ComponentType.ACTION,
      name: 'issue_event',
      description: 'Triggers when a new issue is created',
      is_active: true,
      webhook_endpoint: '/webhooks/github',
    });

    await this.variablesService.create({
      component_id: issueEventComponent.id,
      name: 'repository',
      description:
        'Full repository name (owner/repo, e.g., "octocat/Hello-World"). Leave empty to match all repositories.',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: true,
      placeholder: 'octocat/Hello-World',
      display_order: 1,
    });

    // Create output variables for issue_event
    await Promise.all([
      this.variablesService.create({
        component_id: issueEventComponent.id,
        name: 'issue_title',
        description: 'Title of the issue',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      this.variablesService.create({
        component_id: issueEventComponent.id,
        name: 'issue_body',
        description: 'Body/description of the issue',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

      this.variablesService.create({
        component_id: issueEventComponent.id,
        name: 'issue_link',
        description: 'Direct URL to the issue on GitHub',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.URL,
        nullable: false,
        display_order: 3,
      }),

      this.variablesService.create({
        component_id: issueEventComponent.id,
        name: 'issue_author_username',
        description: 'GitHub username of the issue author',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 4,
      }),

      this.variablesService.create({
        component_id: issueEventComponent.id,
        name: 'issue_milestone',
        description: 'Milestone associated with the issue (null if none)',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: true,
        display_order: 5,
      }),

      this.variablesService.create({
        component_id: issueEventComponent.id,
        name: 'issue_labels',
        description: 'Comma-separated list of issue labels',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 6,
      }),

      this.variablesService.create({
        component_id: issueEventComponent.id,
        name: 'repository_name',
        description: 'Full repository name (owner/repo)',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 7,
      }),

      this.variablesService.create({
        component_id: issueEventComponent.id,
        name: 'issue_number',
        description: 'Issue number',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.NUMBER,
        nullable: false,
        display_order: 8,
      }),
    ]);

    console.log(
      'GitHub service and webhook action components created successfully',
    );
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
      description: 'Email management and automation with Gmail',
      icon_path: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
      requires_auth: true,
      is_active: true,
    });

    // Create new_email_received action component
    const newEmailReceivedAction = await this.componentsService.create({
      service_id: gmailService.id,
      type: ComponentType.ACTION,
      name: 'new_email_received',
      description: 'Triggers when a new email is received in Gmail inbox',
      is_active: true,
      polling_interval: 60000, // Check every minute
    });

    await Promise.all([
      // Return values for the action
      this.variablesService.create({
        component_id: newEmailReceivedAction.id,
        name: 'email_id',
        description: 'Gmail message ID',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      this.variablesService.create({
        component_id: newEmailReceivedAction.id,
        name: 'subject',
        description: 'Email subject',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

      this.variablesService.create({
        component_id: newEmailReceivedAction.id,
        name: 'from',
        description: 'Sender email address',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.EMAIL,
        nullable: false,
        display_order: 3,
      }),

      this.variablesService.create({
        component_id: newEmailReceivedAction.id,
        name: 'snippet',
        description: 'Email preview snippet',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 4,
      }),

      this.variablesService.create({
        component_id: newEmailReceivedAction.id,
        name: 'received_at',
        description: 'Timestamp when email was received',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.DATE,
        nullable: false,
        display_order: 5,
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
      // Parameters for send_gmail reaction
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

      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'subject',
        description: 'Email subject line',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: 'AREA Notification',
        display_order: 2,
      }),

      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'body',
        description: 'Email message body',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: 'Your AREA was triggered successfully.',
        display_order: 3,
      }),

      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'cc',
        description: 'CC email addresses (comma-separated, optional)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'cc@example.com',
        display_order: 4,
      }),

      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'bcc',
        description: 'BCC email addresses (comma-separated, optional)',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: true,
        placeholder: 'bcc@example.com',
        display_order: 5,
      }),

      // Return values
      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'message_id',
        description: 'Gmail message ID of sent email',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      this.variablesService.create({
        component_id: sendGmailReaction.id,
        name: 'sent_at',
        description: 'Timestamp when email was sent',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.DATE,
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

      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'streamer_id',
        description: 'Twitch user ID of the streamer',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'streamer_login',
        description: 'Twitch login of the streamer',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'stream_title',
        description: 'Title of the stream',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 3,
      }),

      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'game_name',
        description: 'Name of the game being played',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 4,
      }),

      this.variablesService.create({
        component_id: streamerGoesLiveAction.id,
        name: 'viewer_count',
        description: 'Current number of viewers',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.NUMBER,
        nullable: false,
        display_order: 5,
      }),

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

    const sendChatMessageReaction = await this.componentsService.create({
      service_id: twitchService.id,
      type: ComponentType.REACTION,
      name: 'send_chat_message',
      description: 'Send a message to a Twitch chat channel',
      is_active: true,
    });

    await Promise.all([
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

      this.variablesService.create({
        component_id: sendChatMessageReaction.id,
        name: 'broadcaster_id',
        description: 'Twitch user ID of the broadcaster',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 1,
      }),

      this.variablesService.create({
        component_id: sendChatMessageReaction.id,
        name: 'broadcaster_username',
        description: 'Twitch username of the broadcaster',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.STRING,
        nullable: false,
        display_order: 2,
      }),

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

  private async createYoutubeService(): Promise<void> {
    try {
      await this.servicesService.findByName('YouTube');
      console.log('YouTube service already exists, skipping creation');
      return;
    } catch {
      console.log('Creating YouTube service...');
    }

    await this.servicesService.create({
      name: 'YouTube',
      description:
        'Interact with YouTube - manage videos, playlists, and channels',
      icon_path:
        'https://www.youtube.com/s/desktop/f506bd45/img/favicon_32x32.png',
      requires_auth: true,
      is_active: true,
    });

    console.log(
      'YouTube service created successfully (no actions/reactions yet)',
    );
  }
}
