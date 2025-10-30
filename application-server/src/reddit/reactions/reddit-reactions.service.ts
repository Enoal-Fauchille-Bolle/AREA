import { Injectable, Logger } from '@nestjs/common';
import { AreaExecutionsService } from '../../area-executions/area-executions.service';
import { AreaParametersService } from '../../area-parameters/area-parameters.service';

interface CreatePostParams {
  subreddit: string;
  title: string;
  text: string;
}

@Injectable()
export class RedditReactionsService {
  private readonly logger = new Logger(RedditReactionsService.name);

  constructor(
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
  ) {}

  /**
   * Create a post in a subreddit (REACTION)
   * Note: This is a mock implementation since Reddit API requires OAuth2
   */
  async createPost(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing Reddit create_post for execution ${executionId}, area ${areaId}`,
      );

      // Get post parameters from the area
      const postParams = await this.getPostParameters(areaId, executionId);

      if (!postParams) {
        throw new Error('Reddit post parameters not configured');
      }

      this.logger.debug(`Creating post in r/${postParams.subreddit}`);
      this.logger.debug(`Title: ${postParams.title}`);
      this.logger.debug(`Text length: ${postParams.text.length} characters`);

      // Mock post creation (in reality would use Reddit OAuth2 + API)
      const mockPostId = `t3_${Date.now().toString(36)}`;
      const mockPostUrl = `https://www.reddit.com/r/${postParams.subreddit}/comments/${mockPostId}`;

      this.logger.log(
        `[MOCK] Post would be created in r/${postParams.subreddit}: "${postParams.title}"`,
      );

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `[MOCK] Post created successfully in r/${postParams.subreddit}`,
          post_id: mockPostId,
          post_url: mockPostUrl,
          subreddit: postParams.subreddit,
          title: postParams.title,
        },
      });

      this.logger.log(
        `[MOCK] Post created successfully in r/${postParams.subreddit} for execution ${executionId}`,
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

  async processReaction(executionId: number, areaId: number): Promise<void> {
    await this.createPost(executionId, areaId);
  }
}
