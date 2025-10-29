export interface ComponentParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'email' | 'url';
  required: boolean;
  placeholder?: string;
  validation?: string;
}

export interface ComponentConfig {
  componentName: string;
  parameters: ComponentParameter[];
}

export const clockComponentsConfig: ComponentConfig[] = [
  {
    componentName: 'daily_timer',
    parameters: [
      {
        name: 'time',
        description: 'Time of day to trigger (HH:MM format, 24-hour)',
        type: 'string',
        required: true,
        placeholder: '09:30',
        validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
      },
    ],
  },
  {
    componentName: 'weekly_timer',
    parameters: [
      {
        name: 'time',
        description: 'Time of day to trigger (HH:MM format, 24-hour)',
        type: 'string',
        required: true,
        placeholder: '09:30',
        validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
      },
      {
        name: 'days_of_week',
        description: 'Days of week to trigger (comma-separated)',
        type: 'string',
        required: true,
        placeholder: 'monday,friday',
      },
    ],
  },
  {
    componentName: 'monthly_timer',
    parameters: [
      {
        name: 'time',
        description: 'Time of day to trigger (HH:MM format, 24-hour)',
        type: 'string',
        required: true,
        placeholder: '09:30',
        validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
      },
      {
        name: 'days_of_month',
        description:
          'Days of month to trigger (comma-separated: 1,15,30 or "last" for last day)',
        type: 'string',
        required: true,
        placeholder: '1,15',
      },
    ],
  },
  {
    componentName: 'interval_timer',
    parameters: [
      {
        name: 'interval_minutes',
        description: 'Interval in minutes between triggers',
        type: 'number',
        required: true,
        placeholder: '30',
      },
      {
        name: 'start_time',
        description: 'Time to start the interval (HH:MM format, 24-hour)',
        type: 'string',
        required: true,
        placeholder: '09:00',
        validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
      },
    ],
  },
];

export const emailComponentsConfig: ComponentConfig[] = [
  {
    componentName: 'send_email',
    parameters: [
      {
        name: 'to',
        description: 'Recipient email address',
        type: 'email',
        required: true,
        placeholder: 'user@example.com',
        validation: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      {
        name: 'subject',
        description: 'Email subject line',
        type: 'string',
        required: false,
        placeholder: 'AREA Notification',
      },
      {
        name: 'body',
        description: 'Email message body',
        type: 'string',
        required: false,
        placeholder: 'Your AREA was triggered successfully.',
      },
    ],
  },
];

export const discordComponentsConfig: ComponentConfig[] = [
  {
    componentName: 'send_message',
    parameters: [
      {
        name: 'channel_id',
        description: 'Discord channel ID where the message will be sent',
        type: 'string',
        required: true,
        placeholder: '123456789012345678',
        validation: '^[0-9]{17,19}$',
      },
      {
        name: 'content',
        description: 'Message content to send (supports Discord markdown)',
        type: 'string',
        required: true,
        placeholder: 'Hello from AREA! 👋',
      },
    ],
  },
  {
    componentName: 'message_posted',
    parameters: [
      {
        name: 'channel_id',
        description:
          'Discord channel ID to monitor for new messages. The AREA bot must have access to this channel.',
        type: 'string',
        required: true,
        placeholder: '123456789012345678',
        validation: '^[0-9]{17,19}$',
      },
      {
        name: 'author_filter',
        description:
          'Filter messages by author username (optional, case-insensitive)',
        type: 'string',
        required: false,
        placeholder: 'username',
      },
      {
        name: 'content_filter',
        description:
          'Filter messages containing this text (optional, case-insensitive)',
        type: 'string',
        required: false,
        placeholder: 'hello',
      },
    ],
  },
  {
    componentName: 'react_to_message',
    parameters: [
      {
        name: 'channel_id',
        description:
          'Discord channel ID where the message is located. The AREA bot must have access to this channel.',
        type: 'string',
        required: true,
        placeholder: '123456789012345678',
        validation: '^[0-9]{17,19}$',
      },
      {
        name: 'message_id',
        description: 'Discord message ID to react to',
        type: 'string',
        required: true,
        placeholder: '123456789012345678',
        validation: '^[0-9]{17,19}$',
      },
      {
        name: 'emoji',
        description: 'Emoji to react with (Unicode emoji or custom emoji name)',
        type: 'string',
        required: true,
        placeholder: '👍',
      },
    ],
  },
  {
    componentName: 'reaction_added',
    parameters: [
      {
        name: 'channel_id',
        description:
          'Discord channel ID to monitor for reactions. The AREA bot must have access to this channel.',
        type: 'string',
        required: true,
        placeholder: '123456789012345678',
        validation: '^[0-9]{17,19}$',
      },
      {
        name: 'message_id',
        description:
          'Specific message ID to monitor for reactions (optional, monitors all messages if not specified)',
        type: 'string',
        required: false,
        placeholder: '123456789012345678',
        validation: '^[0-9]{17,19}$',
      },
      {
        name: 'emoji_filter',
        description:
          'Filter reactions by emoji (optional, case-insensitive partial match)',
        type: 'string',
        required: false,
        placeholder: '👍',
      },
      {
        name: 'user_filter',
        description:
          'Filter reactions by username (optional, case-insensitive partial match)',
        type: 'string',
        required: false,
        placeholder: 'username',
      },
    ],
  },
];

export const githubComponentsConfig: ComponentConfig[] = [
  {
    componentName: 'push_event',
    parameters: [
      {
        name: 'repository',
        description:
          'Full repository name (owner/repo, e.g., "octocat/Hello-World"). Leave empty to match all repositories.',
        type: 'string',
        required: false,
        placeholder: 'octocat/Hello-World',
      },
    ],
  },
  {
    componentName: 'pull_request_event',
    parameters: [
      {
        name: 'repository',
        description:
          'Full repository name (owner/repo, e.g., "octocat/Hello-World"). Leave empty to match all repositories.',
        type: 'string',
        required: false,
        placeholder: 'octocat/Hello-World',
      },
    ],
  },
  {
    componentName: 'issue_event',
    parameters: [
      {
        name: 'repository',
        description:
          'Full repository name (owner/repo, e.g., "octocat/Hello-World"). Leave empty to match all repositories.',
        type: 'string',
        required: false,
        placeholder: 'octocat/Hello-World',
      },
    ],
  },
];

export const twitchComponentsConfig: ComponentConfig[] = [
  {
    componentName: 'streamer_goes_live',
    parameters: [
      {
        name: 'streamer_username',
        description: 'Twitch username of the streamer to monitor',
        type: 'string',
        required: true,
        placeholder: 'name',
      },
    ],
  },
  {
    componentName: 'send_chat_message',
    parameters: [
      {
        name: 'broadcaster_username',
        description: 'Twitch username of the channel to send message to',
        type: 'string',
        required: true,
        placeholder: 'name',
      },
      {
        name: 'message',
        description: 'Message content to send in chat',
        type: 'string',
        required: true,
        placeholder: 'Hello from AREA! 👋',
      },
    ],
  },
];

export const gmailComponentsConfig: ComponentConfig[] = [
  {
    componentName: 'new_email_received',
    parameters: [
      {
        name: 'from',
        description:
          'Filter emails by sender address (optional, leave empty to monitor all emails)',
        type: 'email',
        required: false,
        placeholder: 'sender@example.com',
        validation: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      {
        name: 'subject_contains',
        description:
          'Filter emails by subject keywords (optional, case-insensitive)',
        type: 'string',
        required: false,
        placeholder: 'Important',
      },
    ],
  },
  {
    componentName: 'send_gmail',
    parameters: [
      {
        name: 'to',
        description: 'Recipient email address',
        type: 'email',
        required: true,
        placeholder: 'recipient@example.com',
        validation: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      {
        name: 'subject',
        description: 'Email subject line',
        type: 'string',
        required: true,
        placeholder: 'AREA Notification',
      },
      {
        name: 'body',
        description: 'Email message body (plain text)',
        type: 'string',
        required: true,
        placeholder: 'Your AREA was triggered successfully.',
      },
      {
        name: 'cc',
        description:
          'Carbon copy recipients (optional, comma-separated for multiple)',
        type: 'email',
        required: false,
        placeholder: 'cc@example.com',
      },
      {
        name: 'bcc',
        description:
          'Blind carbon copy recipients (optional, comma-separated for multiple)',
        type: 'email',
        required: false,
        placeholder: 'bcc@example.com',
      },
    ],
  },
];

export function getComponentParameters(
  componentName: string,
): ComponentParameter[] {
  const allConfigs = [
    ...clockComponentsConfig,
    ...emailComponentsConfig,
    ...discordComponentsConfig,
    ...githubComponentsConfig,
    ...twitchComponentsConfig,
    ...gmailComponentsConfig,
  ];
  const config = allConfigs.find((c) => c.componentName === componentName);
  return config ? config.parameters : [];
}

export function getRequiredParameters(
  actionComponentName: string,
  reactionComponentName: string,
): ComponentParameter[] {
  const actionParams = getComponentParameters(actionComponentName);
  const reactionParams = getComponentParameters(reactionComponentName);
  return [...actionParams, ...reactionParams];
}
