import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { AreasService } from '../areas/areas.service';
import { ReactionProcessorService } from '../common/reaction-processor.service';
import { ExecutionStatus } from '../area-executions/entities/area-execution.entity';
import type { AppConfig } from '../config';
import {
  Client,
  GatewayIntentBits,
  TextChannel,
  Message,
  MessageReaction,
  User,
  PartialMessageReaction,
  PartialUser,
} from 'discord.js';

interface SendMessageParams {
  channel_id: string;
  content: string;
}

interface MessagePostedParams {
  channel_id: string;
  author_filter?: string;
  content_filter?: string;
}

interface ReactionAddedParams {
  channel_id: string;
  message_id?: string;
  emoji_filter?: string;
  user_filter?: string;
}

interface ReactToMessageParams {
  channel_id: string;
  message_id: string;
  emoji: string;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly client: Client;
  private readonly botToken: string | undefined;

  constructor(
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
    private readonly areasService: AreasService,
    @Inject(forwardRef(() => ReactionProcessorService))
    private readonly reactionProcessorService: ReactionProcessorService,
    private readonly configService: ConfigService,
  ) {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      throw new Error('App configuration is not properly loaded');
    }
    this.botToken = appConfig.oauth2.discord.botToken;

    if (!this.botToken) {
      this.logger.warn(
        'Discord Bot Token not configured. Discord REActions will not work.',
      );
      this.client = new Client({ intents: [] });
    } else {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMessageReactions,
        ],
      });

      this.client.once('clientReady', () => {
        this.logger.log(`Discord bot logged in as ${this.client.user?.tag}`);
      });

      this.client.on('error', (error) => {
        this.logger.error('Discord client error:', error);
      });

      // Listen for new messages
      this.client.on('messageCreate', (message) => {
        void this.handleNewMessage(message);
      });

      // Listen for reaction additions
      this.client.on('messageReactionAdd', (reaction, user) => {
        void this.handleReactionAdd(reaction, user);
      });

      void this.initializeBot();
    }
  }

  private async initializeBot(): Promise<void> {
    try {
      await this.client.login(this.botToken);
    } catch (error) {
      this.logger.error('Failed to login Discord bot:', error);
    }
  }

  async sendMessage(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing send discord message for execution ${executionId}, area ${areaId}`,
      );

      // Check if bot token is configured
      if (!this.botToken) {
        throw new Error(
          'Discord Bot Token not configured. Please check DISCORD_BOT_TOKEN environment variable.',
        );
      }

      // Check if client is ready
      if (!this.client.isReady()) {
        this.logger.warn(
          `Discord client not ready yet. Current state: ${this.client.readyAt ? 'logged in' : 'not logged in'}`,
        );
        throw new Error(
          'Discord Bot is not ready yet. Please wait for the bot to initialize.',
        );
      }

      // Get message parameters with variable interpolation
      const messageParams = await this.getMessageParameters(
        areaId,
        executionId,
      );

      if (!messageParams) {
        throw new Error('Send Discord message parameters not configured');
      }

      // Send message to Discord using discord.js
      const message = await this.sendDiscordMessage(messageParams);

      // Build message URL
      const messageUrl = `https://discord.com/channels/${message.guildId || '@me'}/${messageParams.channel_id}/${message.id}`;

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Discord message sent successfully to channel ${messageParams.channel_id}`,
          message_id: message.id,
          message_url: messageUrl,
          sent_at: message.createdAt.toISOString(),
        },
      });

      this.logger.log(
        `Discord message sent successfully to channel ${messageParams.channel_id} for execution ${executionId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send Discord message for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      // Update execution as failed
      await this.areaExecutionsService.failExecution(executionId, errorMessage);
    }
  }

  private async sendDiscordMessage(params: SendMessageParams) {
    try {
      const channel = await this.client.channels.fetch(params.channel_id);
      if (!channel || !channel.isTextBased()) {
        throw new BadRequestException(
          `Channel ${params.channel_id} is not a text channel or does not exist`,
        );
      }

      const textChannel = channel as TextChannel;
      const message = await textChannel.send(params.content);

      return message;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to send Discord message: ${errorMessage}`,
      );
    }
  }

  private async getMessageParameters(
    areaId: number,
    executionId?: number,
  ): Promise<SendMessageParams | null> {
    try {
      // Get execution context for variable interpolation
      let executionContext: Record<string, unknown> = {};
      if (executionId) {
        const execution = await this.areaExecutionsService.findOne(executionId);
        if (execution.triggerData) {
          executionContext = execution.triggerData;
        }
      }

      // Get parameters with variable interpolation
      const parameters =
        await this.areaParametersService.findByAreaWithInterpolation(
          areaId,
          executionContext,
        );

      const channelParam = parameters.find(
        (p) => p.variable?.name === 'channel_id',
      );
      const contentParam = parameters.find(
        (p) => p.variable?.name === 'content',
      );

      if (!channelParam?.value || !contentParam?.value) {
        throw new Error(
          'Required Discord message parameters (channel_id, content) are not set',
        );
      }

      return {
        channel_id: channelParam.value,
        content: contentParam.value,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to get Discord message parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  async processReaction(executionId: number, areaId: number): Promise<void> {
    // For backward compatibility, default to send message
    await this.sendMessage(executionId, areaId);
  }

  async sendMessageReaction(
    executionId: number,
    areaId: number,
  ): Promise<void> {
    await this.sendMessage(executionId, areaId);
  }

  async reactToMessageReaction(
    executionId: number,
    areaId: number,
  ): Promise<void> {
    await this.reactToMessage(executionId, areaId);
  }

  async reactToMessage(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing react to message for execution ${executionId}, area ${areaId}`,
      );

      // Check if bot token is configured
      if (!this.botToken) {
        throw new Error(
          'Discord Bot Token not configured. Please check DISCORD_BOT_TOKEN environment variable.',
        );
      }

      // Check if client is ready
      if (!this.client.isReady()) {
        this.logger.warn(
          `Discord client not ready yet. Current state: ${this.client.readyAt ? 'logged in' : 'not logged in'}`,
        );
        throw new Error(
          'Discord Bot is not ready yet. Please wait for the bot to initialize.',
        );
      }

      // Get reaction parameters
      // Get reaction parameters with variable interpolation
      const reactionParams = await this.getReactionParameters(
        areaId,
        executionId,
      );

      if (!reactionParams) {
        throw new Error('React to message parameters not configured');
      }

      // React to the message using discord.js
      await this.addReactionToMessage(reactionParams);

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Successfully reacted to message ${reactionParams.message_id} in channel ${reactionParams.channel_id} with ${reactionParams.emoji}`,
          channel_id: reactionParams.channel_id,
          message_id: reactionParams.message_id,
          emoji: reactionParams.emoji,
          reacted_at: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Successfully reacted to message ${reactionParams.message_id} for execution ${executionId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to react to message for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      // Update execution as failed
      await this.areaExecutionsService.failExecution(executionId, errorMessage);
    }
  }

  private async handleNewMessage(message: Message): Promise<void> {
    // Skip bot messages
    if (message.author.bot) {
      return;
    }

    try {
      const messagePostedAreas =
        await this.areasService.findByActionComponent('message_posted');

      for (const area of messagePostedAreas) {
        try {
          const monitorParams = await this.getMessageMonitoringParameters(
            area.id,
          );
          if (!monitorParams) {
            continue;
          }

          // Check if this message is from the monitored channel
          if (monitorParams.channel_id !== message.channel.id) {
            continue;
          }

          // Apply author filter if specified
          if (
            monitorParams.author_filter &&
            !message.author.username
              .toLowerCase()
              .includes(monitorParams.author_filter.toLowerCase())
          ) {
            continue;
          }

          // Apply content filter if specified
          if (
            monitorParams.content_filter &&
            !message.content
              .toLowerCase()
              .includes(monitorParams.content_filter.toLowerCase())
          ) {
            continue;
          }

          // Create execution for this area with proper trigger data
          const execution = await this.areaExecutionsService.create({
            areaId: area.id,
            status: ExecutionStatus.PENDING,
            triggerData: {
              author_name: message.author.username,
              author_id: message.author.id,
              message_content: message.content,
              message_id: message.id,
              current_time: message.createdAt.toISOString(),
            },
            startedAt: new Date(),
          });

          // Process the reaction using the injected service
          await this.reactionProcessorService.processReaction(
            area.component_reaction_id,
            execution.id,
            area.id,
          );

          this.logger.log(
            `Successfully triggered area ${area.id} for message from ${message.author.username}`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to process message for area ${area.id}: ${errorMessage}`,
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling new message: ${errorMessage}`);
    }
  }

  private async getMessageMonitoringParameters(
    areaId: number,
  ): Promise<MessagePostedParams | null> {
    try {
      const parameters = await this.areaParametersService.findByArea(areaId);

      const channelParam = parameters.find(
        (p) => p.variable?.name === 'channel_id',
      );
      const authorFilterParam = parameters.find(
        (p) => p.variable?.name === 'author_filter',
      );
      const contentFilterParam = parameters.find(
        (p) => p.variable?.name === 'content_filter',
      );

      if (!channelParam?.value) {
        throw new Error(
          'Required Discord monitoring parameter (channel_id) is not set',
        );
      }

      return {
        channel_id: channelParam.value,
        author_filter: authorFilterParam?.value || undefined,
        content_filter: contentFilterParam?.value || undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to get Discord monitoring parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  private async getReactionParameters(
    areaId: number,
    executionId?: number,
  ): Promise<ReactToMessageParams | null> {
    try {
      // Get execution context for variable interpolation
      let executionContext: Record<string, unknown> = {};
      if (executionId) {
        const execution = await this.areaExecutionsService.findOne(executionId);
        if (execution.triggerData) {
          executionContext = execution.triggerData;
        }
      }

      // Get parameters with variable interpolation
      const parameters =
        await this.areaParametersService.findByAreaWithInterpolation(
          areaId,
          executionContext,
        );

      const channelParam = parameters.find(
        (p) => p.variable?.name === 'channel_id',
      );
      const messageIdParam = parameters.find(
        (p) => p.variable?.name === 'message_id',
      );
      const emojiParam = parameters.find((p) => p.variable?.name === 'emoji');

      if (
        !channelParam?.value ||
        !messageIdParam?.value ||
        !emojiParam?.value
      ) {
        throw new Error(
          'Required Discord reaction parameters (channel_id, message_id, emoji) are not set',
        );
      }

      return {
        channel_id: channelParam.value,
        message_id: messageIdParam.value,
        emoji: emojiParam.value,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to get Discord reaction parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  private async addReactionToMessage(params: ReactToMessageParams) {
    try {
      const channel = await this.client.channels.fetch(params.channel_id);

      if (!channel || !channel.isTextBased()) {
        throw new BadRequestException(
          `Channel ${params.channel_id} is not a text channel or does not exist`,
        );
      }

      const textChannel = channel as TextChannel;
      const message = await textChannel.messages.fetch(params.message_id);

      if (!message) {
        throw new BadRequestException(
          `Message ${params.message_id} not found in channel ${params.channel_id}`,
        );
      }

      await message.react(params.emoji);

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to react to Discord message: ${errorMessage}`,
      );
    }
  }

  private async getReactionMonitoringParameters(
    areaId: number,
  ): Promise<ReactionAddedParams | null> {
    try {
      const parameters = await this.areaParametersService.findByArea(areaId);

      const channelParam = parameters.find(
        (p) => p.variable?.name === 'channel_id',
      );
      const messageIdParam = parameters.find(
        (p) => p.variable?.name === 'message_id',
      );
      const emojiFilterParam = parameters.find(
        (p) => p.variable?.name === 'emoji_filter',
      );
      const userFilterParam = parameters.find(
        (p) => p.variable?.name === 'user_filter',
      );

      if (!channelParam?.value) {
        throw new Error(
          'Required Discord reaction monitoring parameter (channel_id) is not set',
        );
      }

      return {
        channel_id: channelParam.value,
        message_id: messageIdParam?.value || undefined,
        emoji_filter: emojiFilterParam?.value || undefined,
        user_filter: userFilterParam?.value || undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to get Discord reaction monitoring parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  private async handleReactionAdd(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ): Promise<void> {
    // Skip bot reactions
    if (user.bot) {
      return;
    }

    try {
      // Fetch partial data if needed
      if (reaction.partial) {
        await reaction.fetch();
      }
      if (user.partial) {
        await user.fetch();
      }

      const reactionAddedAreas =
        await this.areasService.findByActionComponent('reaction_added');

      for (const area of reactionAddedAreas) {
        try {
          const monitorParams = await this.getReactionMonitoringParameters(
            area.id,
          );
          if (!monitorParams) {
            continue;
          }

          // Check if this reaction is from the monitored channel
          if (monitorParams.channel_id !== reaction.message.channelId) {
            continue;
          }

          // Check message ID filter if specified
          if (
            monitorParams.message_id &&
            monitorParams.message_id !== reaction.message.id
          ) {
            continue;
          }

          // Check emoji filter if specified
          if (monitorParams.emoji_filter) {
            const emojiName = reaction.emoji.name || reaction.emoji.toString();
            if (
              !emojiName
                .toLowerCase()
                .includes(monitorParams.emoji_filter.toLowerCase())
            ) {
              continue;
            }
          }

          // Check user filter if specified
          if (
            monitorParams.user_filter &&
            !user.username
              ?.toLowerCase()
              .includes(monitorParams.user_filter.toLowerCase())
          ) {
            continue;
          }

          // Create execution for this area with proper trigger data
          const execution = await this.areaExecutionsService.create({
            areaId: area.id,
            status: ExecutionStatus.PENDING,
            triggerData: {
              user_name: user.username,
              user_id: user.id,
              emoji_name: reaction.emoji.name || reaction.emoji.toString(),
              emoji_id: reaction.emoji.id,
              message_id: reaction.message.id,
              channel_id: reaction.message.channelId,
              current_time: new Date().toISOString(),
            },
            startedAt: new Date(),
          });

          // Process the reaction using the injected service
          await this.reactionProcessorService.processReaction(
            area.component_reaction_id,
            execution.id,
            area.id,
          );

          this.logger.log(
            `Successfully triggered area ${area.id} for reaction from ${user.username}`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to process reaction for area ${area.id}: ${errorMessage}`,
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling reaction add: ${errorMessage}`);
    }
  }
}
