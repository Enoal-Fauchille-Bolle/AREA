import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaExecutionsService } from '../../area-executions/area-executions.service';
import { AreaParametersService } from '../../area-parameters/area-parameters.service';
import { UserServicesService } from '../../services/user-services/user-services.service';
import { ServicesService } from '../../services/services.service';
import { Area } from '../../areas/entities/area.entity';

interface CreatePostParams {
  subreddit: string;
  title: string;
  text: string;
}

interface RedditSubmitResponse {
  json: {
    data: {
      id: string;
      name: string;
      url: string;
    };
  };
}

@Injectable()
export class RedditReactionsService {
  private readonly logger = new Logger(RedditReactionsService.name);
  private readonly redditOAuthApiUrl = 'https://oauth.reddit.com';

  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
    private readonly userServicesService: UserServicesService,
    private readonly servicesService: ServicesService,
  ) {}

  /**
   * Create a post in a subreddit (REACTION)
   * Uses Reddit OAuth2 API to submit posts
   */
  async createPost(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing Reddit create_post for execution ${executionId}, area ${areaId}`,
      );

      // Get the area to find the user
      const area = await this.areaRepository.findOne({
        where: { id: areaId },
      });

      if (!area) {
        throw new Error(`Area with ID ${areaId} not found`);
      }

      const userId = area.user_id;

      // Get user's Reddit OAuth token
      const accessToken = await this.getUserRedditToken(userId);

      // Get post parameters from the area
      const postParams = await this.getPostParameters(areaId, executionId);

      if (!postParams) {
        throw new Error('Reddit post parameters not configured');
      }

      this.logger.debug(`Creating post in r/${postParams.subreddit}`);
      this.logger.debug(`Title: ${postParams.title}`);
      this.logger.debug(`Text length: ${postParams.text.length} characters`);

      // Create post via Reddit OAuth2 API
      const postResult = await this.submitRedditPost(
        accessToken,
        postParams.subreddit,
        postParams.title,
        postParams.text,
      );

      this.logger.log(
        `Post created successfully in r/${postParams.subreddit}: ${postResult.url}`,
      );

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Post created successfully in r/${postParams.subreddit}`,
          post_id: postResult.id,
          post_url: postResult.url,
          subreddit: postParams.subreddit,
          title: postParams.title,
        },
      });

      this.logger.log(
        `Post created successfully in r/${postParams.subreddit} for execution ${executionId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to create Reddit post for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      // Update execution as failed
      await this.areaExecutionsService.failExecution(executionId, errorMessage);
    }
  }

  private async getPostParameters(
    areaId: number,
    executionId?: number,
  ): Promise<CreatePostParams | null> {
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

      const subredditParam = parameters.find(
        (p) => p.variable?.name === 'subreddit',
      );
      const titleParam = parameters.find((p) => p.variable?.name === 'title');
      const textParam = parameters.find((p) => p.variable?.name === 'text');

      if (!subredditParam?.value || !titleParam?.value) {
        throw new Error('Required Reddit post parameters not configured');
      }

      return {
        subreddit: subredditParam.value,
        title: titleParam.value,
        text: textParam?.value || '',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to get Reddit post parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  /**
   * Submit a post to Reddit via OAuth2 API
   */
  private async submitRedditPost(
    accessToken: string,
    subreddit: string,
    title: string,
    text: string,
  ): Promise<{ id: string; url: string }> {
    try {
      const formData = new URLSearchParams({
        sr: subreddit,
        kind: 'self', // Text post
        title: title,
        text: text,
        api_type: 'json',
      });

      const response = await fetch(
        `${this.redditOAuthApiUrl}/api/submit`,
        {
          method: 'POST',
          headers: {
            'User-Agent': 'AREA-Application/1.0',
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Reddit API error: ${response.status} - ${errorData}`,
        );
      }

      const result = (await response.json()) as RedditSubmitResponse;

      return {
        id: result.json.data.id,
        url: result.json.data.url,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to submit Reddit post: ${errorMessage}`,
      );
    }
  }

  /**
   * Get user's Reddit OAuth access token
   */
  private async getUserRedditToken(userId: number): Promise<string> {
    try {
      // Find Reddit service
      const services = await this.servicesService.findAll();
      const redditService = services.find(
        (s) => s.name.toLowerCase() === 'reddit',
      );

      if (!redditService) {
        throw new Error('Reddit service not found');
      }

      // Get user's Reddit service connection
      const userService = await this.userServicesService.findOne(
        userId,
        redditService.id,
      );

      if (!userService || !userService.oauth_token) {
        throw new Error(
          'User has not connected their Reddit account or token is missing',
        );
      }

      // Check if token is expired and refresh if needed
      if (
        userService.token_expires_at &&
        new Date(userService.token_expires_at) <= new Date()
      ) {
        this.logger.log(
          `Reddit token expired for user ${userId}, refreshing...`,
        );
        await this.servicesService.refreshServiceToken(userId, redditService.id);

        // Fetch the updated token
        const updatedUserService = await this.userServicesService.findOne(
          userId,
          redditService.id,
        );

        if (!updatedUserService || !updatedUserService.oauth_token) {
          throw new Error('Failed to refresh Reddit token');
        }

        return updatedUserService.oauth_token;
      }

      return userService.oauth_token;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to get Reddit access token: ${errorMessage}`,
      );
    }
  }

  async processReaction(executionId: number, areaId: number): Promise<void> {
    await this.createPost(executionId, areaId);
  }
}
