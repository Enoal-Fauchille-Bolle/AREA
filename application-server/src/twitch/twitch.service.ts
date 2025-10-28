import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { UserServicesService } from '../services/user-services/user-services.service';
import { ServicesService } from '../services/services.service';
import { HookStatesService } from '../hook-states/hook-states.service';
import { AreasService } from '../areas/areas.service';
import { Area } from '../areas/entities/area.entity';
import { ConfigService } from '@nestjs/config';
import { ReactionProcessorService } from '../common/reaction-processor.service';
import type { AppConfig } from '../config';

interface SendChatMessageParams {
  broadcaster_id: string;
  message: string;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

interface TwitchUsersResponse {
  data: TwitchUser[];
}

@Injectable()
export class TwitchService {
  private readonly logger = new Logger(TwitchService.name);
  private readonly twitchApiUrl = 'https://api.twitch.tv/helix';
  private readonly clientId: string | undefined;

  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
    private readonly userServicesService: UserServicesService,
    private readonly servicesService: ServicesService,
    private readonly configService: ConfigService,
    private readonly hookStatesService: HookStatesService,
    private readonly areasService: AreasService,
    @Inject(forwardRef(() => ReactionProcessorService))
    private readonly reactionProcessorService: ReactionProcessorService,
  ) {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      throw new Error('App configuration is not properly loaded');
    }
    this.clientId = appConfig.oauth2.twitch?.clientId;
  }

  /**
   * Cron job to check for streamers going live every 30 seconds
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkStreamersGoingLive(): Promise<void> {
    this.logger.debug('Checking for Twitch streamers going live...');

    try {
      // Find all areas with streamer_goes_live action
      const areas =
        await this.areasService.findByActionComponent('streamer_goes_live');

      for (const area of areas) {
        await this.checkStreamerGoingLiveForArea(area);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error checking Twitch streamers: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async checkStreamerGoingLiveForArea(area: Area): Promise<void> {
    try {
      const userId = area.user_id;

      // Get user's Twitch access token
      const accessToken = await this.getUserTwitchToken(userId);

      // Get streamer username parameter
      const parameters = await this.areaParametersService.findByArea(area.id);
      const streamerUsernameParam = parameters.find(
        (p) => p.variable?.name === 'streamer_username',
      );

      if (!streamerUsernameParam?.value) {
        this.logger.warn(
          `No streamer_username parameter set for area ${area.id}`,
        );
        return;
      }

      const streamerUsername = streamerUsernameParam.value;

      // Get the last checked state
      const stateKey = `streamer_live_${area.id}`;
      const lastState = await this.hookStatesService.getState(
        area.id,
        stateKey,
      );

      // Check if streamer is currently live
      const streamData = await this.getStreamData(
        accessToken,
        streamerUsername,
      );

      if (streamData && !lastState) {
        // Streamer just went live!
        this.logger.log(
          `Streamer ${streamerUsername} went live for area ${area.id}`,
        );

        // Store that we've detected this stream session
        await this.hookStatesService.setState(area.id, stateKey, streamData.id);

        // Create execution for this trigger
        const execution = await this.areaExecutionsService.create({
          areaId: area.id,
          triggerData: {
            streamer_id: streamData.user_id,
            streamer_username: streamData.user_login,
            stream_title: streamData.title,
            game_name: streamData.game_name,
            viewer_count: streamData.viewer_count,
            started_at: streamData.started_at,
          },
          startedAt: new Date(),
        });

        // Process the reaction
        await this.reactionProcessorService.processReaction(
          area.component_reaction_id,
          execution.id,
          area.id,
        );
      } else if (!streamData && lastState) {
        // Streamer went offline, clear the state
        await this.hookStatesService.setState(area.id, stateKey, '');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to check streamer for area ${area.id}: ${errorMessage}`,
      );
    }
  }

  private async getStreamData(
    accessToken: string,
    streamerUsername: string,
  ): Promise<{
    id: string;
    user_id: string;
    user_login: string;
    title: string;
    game_name: string;
    viewer_count: number;
    started_at: string;
  } | null> {
    if (!this.clientId) {
      throw new BadRequestException('Twitch is not configured');
    }

    try {
      const response = await fetch(
        `${this.twitchApiUrl}/streams?user_login=${encodeURIComponent(streamerUsername)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': this.clientId,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Twitch API error: ${response.status} - ${errorData}`,
        );
      }

      const data = (await response.json()) as {
        data: Array<{
          id: string;
          user_id: string;
          user_login: string;
          title: string;
          game_name: string;
          viewer_count: number;
          started_at: string;
        }>;
      };
      return data.data.length > 0 ? data.data[0] : null;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to fetch Twitch stream data: ${errorMessage}`,
      );
    }
  }

  /**
   * Send chat message to Twitch channel (REACTION)
   */
  async sendChatMessage(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing send Twitch chat message for execution ${executionId}, area ${areaId}`,
      );

      // Get the area to find the user
      const area = await this.areaRepository.findOne({
        where: { id: areaId },
      });

      if (!area) {
        throw new Error(`Area with ID ${areaId} not found`);
      }

      const userId = area.user_id;

      // Get chat message parameters
      const chatParams = await this.getChatMessageParameters(areaId);

      if (!chatParams) {
        throw new Error('Send Twitch chat message parameters not configured');
      }

      // Get user's Twitch OAuth token
      const accessToken = await this.getUserTwitchToken(userId);

      // Get the broadcaster's user ID
      const broadcasterInfo = await this.getUserByUsername(
        accessToken,
        chatParams.broadcaster_id,
      );

      if (!broadcasterInfo) {
        throw new Error(
          `Broadcaster ${chatParams.broadcaster_id} not found on Twitch`,
        );
      }

      // Get the authenticated user's ID (sender)
      const senderInfo = await this.getAuthenticatedUser(accessToken);

      // Send chat message via Twitch API
      await this.sendTwitchChatMessage(
        accessToken,
        broadcasterInfo.id,
        senderInfo.id,
        chatParams.message,
      );

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Chat message sent successfully to ${chatParams.broadcaster_id}`,
          broadcaster_id: broadcasterInfo.id,
          broadcaster_username: broadcasterInfo.login,
          sent_at: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Twitch chat message sent successfully to ${chatParams.broadcaster_id} for execution ${executionId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send Twitch chat message for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      // Update execution as failed
      await this.areaExecutionsService.failExecution(executionId, errorMessage);
    }
  }

  private async sendTwitchChatMessage(
    accessToken: string,
    broadcasterId: string,
    senderId: string,
    message: string,
  ): Promise<void> {
    if (!this.clientId) {
      throw new BadRequestException('Twitch is not configured');
    }

    try {
      const response = await fetch(`${this.twitchApiUrl}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': this.clientId,
        },
        body: JSON.stringify({
          broadcaster_id: broadcasterId,
          sender_id: senderId,
          message: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Twitch API error: ${response.status} - ${errorData}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to send Twitch chat message: ${errorMessage}`,
      );
    }
  }

  private async getUserByUsername(
    accessToken: string,
    username: string,
  ): Promise<TwitchUser | null> {
    if (!this.clientId) {
      throw new BadRequestException('Twitch is not configured');
    }

    try {
      const response = await fetch(
        `${this.twitchApiUrl}/users?login=${encodeURIComponent(username)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': this.clientId,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Twitch API error: ${response.status} - ${errorData}`,
        );
      }

      const data = (await response.json()) as TwitchUsersResponse;
      return data.data.length > 0 ? data.data[0] : null;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to fetch Twitch user: ${errorMessage}`,
      );
    }
  }

  private async getAuthenticatedUser(accessToken: string): Promise<TwitchUser> {
    if (!this.clientId) {
      throw new BadRequestException('Twitch is not configured');
    }

    try {
      const response = await fetch(`${this.twitchApiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': this.clientId,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Twitch API error: ${response.status} - ${errorData}`,
        );
      }

      const data = (await response.json()) as TwitchUsersResponse;
      if (data.data.length === 0) {
        throw new BadRequestException('No authenticated user found');
      }

      return data.data[0];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to get authenticated user: ${errorMessage}`,
      );
    }
  }

  private async getUserTwitchToken(userId: number): Promise<string> {
    try {
      // Find Twitch service
      const services = await this.servicesService.findAll();
      const twitchService = services.find(
        (s) => s.name.toLowerCase() === 'twitch',
      );

      if (!twitchService) {
        throw new Error('Twitch service not found');
      }

      // Get user's Twitch service connection
      const userService = await this.userServicesService.findOne(
        userId,
        twitchService.id,
      );

      if (!userService || !userService.oauth_token) {
        throw new Error(
          'User has not connected their Twitch account or token is missing',
        );
      }

      // Check if token is expired and refresh if needed
      if (
        userService.token_expires_at &&
        new Date(userService.token_expires_at) <= new Date()
      ) {
        this.logger.log(
          `Twitch token expired for user ${userId}, refreshing...`,
        );
        await this.servicesService.refreshServiceToken(
          userId,
          twitchService.id,
        );

        // Fetch the updated token
        const refreshedUserService = await this.userServicesService.findOne(
          userId,
          twitchService.id,
        );

        if (!refreshedUserService || !refreshedUserService.oauth_token) {
          throw new Error('Failed to refresh Twitch access token');
        }

        return refreshedUserService.oauth_token;
      }

      return userService.oauth_token;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to get Twitch token for user ${userId}: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async getChatMessageParameters(
    areaId: number,
  ): Promise<SendChatMessageParams | null> {
    try {
      const parameters = await this.areaParametersService.findByArea(areaId);

      const broadcasterParam = parameters.find(
        (p) => p.variable?.name === 'broadcaster_username',
      );
      const messageParam = parameters.find(
        (p) => p.variable?.name === 'message',
      );

      if (!broadcasterParam?.value || !messageParam?.value) {
        throw new Error(
          'Required Twitch chat parameters (broadcaster_username, message) are not set',
        );
      }

      return {
        broadcaster_id: broadcasterParam.value,
        message: messageParam.value,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to get Twitch chat parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  async processReaction(executionId: number, areaId: number): Promise<void> {
    await this.sendChatMessage(executionId, areaId);
  }
}
