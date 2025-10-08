import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { UserServicesService } from '../user-services/user-services.service';
import { ServicesService } from '../services/services.service';
import { Area } from '../areas/entities/area.entity';

interface SendMessageParams {
  channel_id: string;
  content: string;
  embed_title?: string;
  embed_description?: string;
  embed_color?: string;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  timestamp?: string;
}

interface DiscordMessagePayload {
  content: string;
  embeds?: DiscordEmbed[];
}

interface DiscordMessageResponse {
  id: string;
  channel_id: string;
  timestamp: string;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly discordApiUrl = 'https://discord.com/api/v10';

  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
    private readonly userServicesService: UserServicesService,
    private readonly servicesService: ServicesService,
  ) {}

  async sendMessage(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing send discord message for execution ${executionId}, area ${areaId}`,
      );

      // Get the area to find the user
      const area = await this.areaRepository.findOne({
        where: { id: areaId },
      });

      if (!area) {
        throw new Error(`Area with ID ${areaId} not found`);
      }

      const userId = area.user_id;

      // Get message parameters
      const messageParams = await this.getMessageParameters(areaId);

      if (!messageParams) {
        throw new Error('Send Discord message parameters not configured');
      }

      // Get user's Discord OAuth token
      const accessToken = await this.getUserDiscordToken(userId);

      // Send message to Discord
      const messageResponse = await this.sendDiscordMessage(
        accessToken,
        messageParams,
      );

      // Build message URL
      const messageUrl = `https://discord.com/channels/@me/${messageParams.channel_id}/${messageResponse.id}`;

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Discord message sent successfully to channel ${messageParams.channel_id}`,
          message_id: messageResponse.id,
          message_url: messageUrl,
          sent_at: messageResponse.timestamp,
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

  private async getUserDiscordToken(userId: number): Promise<string> {
    try {
      // Find Discord service
      const services = await this.servicesService.findAll();
      const discordService = services.find(
        (s) => s.name.toLowerCase() === 'discord',
      );

      if (!discordService) {
        throw new Error('Discord service not found');
      }

      // Get user's Discord service connection
      const userService =
        await this.userServicesService.findUserServiceConnection(
          userId,
          discordService.id,
        );

      if (!userService || !userService.oauth_token) {
        throw new Error(
          'User has not connected their Discord account or token is missing',
        );
      }

      // Check if token is expired and refresh if needed
      if (
        userService.token_expires_at &&
        new Date(userService.token_expires_at) <= new Date()
      ) {
        this.logger.log(
          `Discord token expired for user ${userId}, refreshing...`,
        );
        await this.servicesService.refreshServiceToken(
          userId,
          discordService.id,
        );

        // Fetch the updated token
        const refreshedUserService =
          await this.userServicesService.findUserServiceConnection(
            userId,
            discordService.id,
          );

        if (!refreshedUserService || !refreshedUserService.oauth_token) {
          throw new Error('Failed to refresh Discord access token');
        }

        return refreshedUserService.oauth_token;
      }

      return userService.oauth_token;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to get Discord token for user ${userId}: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async sendDiscordMessage(
    accessToken: string,
    params: SendMessageParams,
  ): Promise<DiscordMessageResponse> {
    try {
      // Build the message payload
      const payload: DiscordMessagePayload = {
        content: params.content,
      };

      // Add embed if any embed parameters are provided
      if (
        params.embed_title ||
        params.embed_description ||
        params.embed_color
      ) {
        const embed: DiscordEmbed = {
          timestamp: new Date().toISOString(),
        };

        if (params.embed_title) {
          embed.title = params.embed_title;
        }

        if (params.embed_description) {
          embed.description = params.embed_description;
        }

        if (params.embed_color) {
          // Convert hex color to decimal
          embed.color = parseInt(params.embed_color, 16);
        }

        payload.embeds = [embed];
      }

      // Send message to Discord API
      const response = await fetch(
        `${this.discordApiUrl}/channels/${params.channel_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Discord API error: ${response.status} - ${errorData}`,
        );
      }

      const messageData = (await response.json()) as DiscordMessageResponse;

      return messageData;
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
      const embedTitleParam = parameters.find(
        (p) => p.variable?.name === 'embed_title',
      );
      const embedDescriptionParam = parameters.find(
        (p) => p.variable?.name === 'embed_description',
      );
      const embedColorParam = parameters.find(
        (p) => p.variable?.name === 'embed_color',
      );

      if (!channelParam?.value || !contentParam?.value) {
        throw new Error(
          'Required Discord message parameters (channel_id, content) are not set',
        );
      }

      return {
        channel_id: channelParam.value,
        content: contentParam.value,
        embed_title: embedTitleParam?.value || undefined,
        embed_description: embedDescriptionParam?.value || undefined,
        embed_color: embedColorParam?.value || undefined,
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
