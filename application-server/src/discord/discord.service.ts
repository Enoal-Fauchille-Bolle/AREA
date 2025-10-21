import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import type { AppConfig } from '../config';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

interface SendMessageParams {
  channel_id: string;
  content: string;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly client: Client;
  private readonly botToken: string | undefined;
  private isClientReady = false;

  constructor(
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
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
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
      });

      this.client.once('clientReady', () => {
        this.isClientReady = true;
        this.logger.log(`Discord bot logged in as ${this.client.user?.tag}`);
      });

      this.client.on('error', (error) => {
        this.logger.error('Discord client error:', error);
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
      if (!this.botToken || !this.isClientReady) {
        throw new Error(
          'Discord Bot is not configured or not ready. Please check DISCORD_BOT_TOKEN environment variable.',
        );
      }

      // Get message parameters
      const messageParams = await this.getMessageParameters(areaId);

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
  ): Promise<SendMessageParams | null> {
    try {
      const parameters = await this.areaParametersService.findByArea(areaId);

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
    await this.sendMessage(executionId, areaId);
  }
}
