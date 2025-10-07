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
        validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
      }
    ]
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
        validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
      },
      {
        name: 'days_of_week',
        description: 'Days of week to trigger (comma-separated)',
        type: 'string',
        required: true,
        placeholder: 'monday,friday'
      }
    ]
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
        validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
      },
      {
        name: 'days_of_month',
        description: 'Days of month to trigger (comma-separated: 1,15,30 or "last" for last day)',
        type: 'string',
        required: true,
        placeholder: '1,15'
      }
    ]
  },
  {
    componentName: 'interval_timer',
    parameters: [
      {
        name: 'interval_minutes',
        description: 'Interval in minutes between triggers',
        type: 'number',
        required: true,
        placeholder: '30'
      },
      {
        name: 'start_time',
        description: 'Time to start the interval (HH:MM format, 24-hour)',
        type: 'string',
        required: true,
        placeholder: '09:00',
        validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
      }
    ]
  }
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
        validation: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
      },
      {
        name: 'subject',
        description: 'Email subject line',
        type: 'string',
        required: false,
        placeholder: 'AREA Notification'
      },
      {
        name: 'body',
        description: 'Email message body',
        type: 'string',
        required: false,
        placeholder: 'Your AREA was triggered successfully.'
      }
    ]
  }
];

export function getComponentParameters(componentName: string): ComponentParameter[] {
  const allConfigs = [...clockComponentsConfig, ...emailComponentsConfig];
  const config = allConfigs.find(c => c.componentName === componentName);
  return config ? config.parameters : [];
}

export function getRequiredParameters(actionComponentName: string, reactionComponentName: string): ComponentParameter[] {
  const actionParams = getComponentParameters(actionComponentName);
  const reactionParams = getComponentParameters(reactionComponentName);
  return [...actionParams, ...reactionParams];
}