import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { ExecutionStatus } from '../area-executions/entities/area-execution.entity';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { UserServicesService } from '../services/user-services/user-services.service';
import { ServicesService } from '../services/services.service';
import { HookStatesService } from '../hook-states/hook-states.service';
import { AreasService } from '../areas/areas.service';
import { Area } from '../areas/entities/area.entity';
import { ReactionProcessorService } from '../common/reaction-processor.service';

interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  score: number;
  created_utc: number;
  permalink: string;
}

interface RedditApiResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

@Injectable()
export class RedditService {
  private readonly logger = new Logger(RedditService.name);
  private readonly redditApiUrl = 'https://www.reddit.com';

  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
    private readonly userServicesService: UserServicesService,
    private readonly servicesService: ServicesService,
    private readonly hookStatesService: HookStatesService,
    private readonly areasService: AreasService,
    @Inject(forwardRef(() => ReactionProcessorService))
    private readonly reactionProcessorService: ReactionProcessorService,
  ) {}

  /**
   * Cron job to check for hot posts every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkHotPosts(): Promise<void> {
    this.logger.debug('Checking for hot posts across all areas...');

    try {
      // Find all areas with hot_post_in_subreddit action
      const areas = await this.areasService.findByActionComponent(
        'hot_post_in_subreddit',
      );

      for (const area of areas) {
        await this.checkHotPostsForArea(area);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error checking hot posts: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async checkHotPostsForArea(area: Area): Promise<void> {
    try {
      const userId = area.user_id;

      // Get user's Reddit OAuth token
      const accessToken = await this.getUserRedditToken(userId);

      // Get subreddit parameter
      const subreddit = await this.getSubredditParameter(area.id);
      if (!subreddit) {
        this.logger.warn(
          `No subreddit configured for area ${area.id}, skipping`,
        );
        return;
      }

      this.logger.debug(
        `Checking hot posts in r/${subreddit} for area ${area.id}`,
      );

      // Get last checked post ID from hook state
      const hookStateKey = `reddit_hot_post_${area.id}_${subreddit}`;
      const lastPostId = await this.hookStatesService.getState(
        userId,
        hookStateKey,
      );

      // Fetch hot posts from subreddit using OAuth
      const posts = await this.fetchHotPosts(subreddit, accessToken);

      if (posts.length === 0) {
        this.logger.debug(`No posts found in r/${subreddit}`);
        return;
      }

      // Get the latest post
      const latestPost = posts[0];

      // Check if this is a new post (different from last checked)
      if (lastPostId && lastPostId === latestPost.id) {
        this.logger.debug(
          `No new hot posts in r/${subreddit} since last check`,
        );
        return;
      }

      // New hot post detected!
      this.logger.log(
        `New hot post detected in r/${subreddit}: "${latestPost.title}"`,
      );

      // Create execution
      const execution = await this.areaExecutionsService.create({
        areaId: area.id,
        status: ExecutionStatus.PENDING,
        triggerData: {
          post_id: latestPost.id,
          post_title: latestPost.title,
          post_author: latestPost.author,
          subreddit: latestPost.subreddit,
          post_url: `https://www.reddit.com${latestPost.permalink}`,
          score: latestPost.score,
          created_at: new Date(latestPost.created_utc * 1000).toISOString(),
        },
      });

      // Update hook state with the latest post ID
      await this.hookStatesService.setState(
        userId,
        hookStateKey,
        latestPost.id,
      );

      // Increment trigger count
      await this.areasService.incrementTriggerCount(area.id);

      // Process the reaction
      await this.reactionProcessorService.processReaction(
        area.component_reaction_id,
        execution.id,
        area.id,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error checking hot posts for area ${area.id}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async getSubredditParameter(areaId: number): Promise<string | null> {
    try {
      const parameters = await this.areaParametersService.findByArea(areaId);
      const subredditParam = parameters.find(
        (p) => p.variable?.name === 'subreddit',
      );
      return subredditParam?.value || null;
    } catch (_error) {
      this.logger.error(`Failed to get subreddit parameter for area ${areaId}`);
      return null;
    }
  }

  private async fetchHotPosts(
    subreddit: string,
    accessToken: string,
  ): Promise<RedditPost[]> {
    try {
      // Use OAuth API endpoint instead of public JSON
      const url = `https://oauth.reddit.com/r/${subreddit}/hot?limit=1`;

      this.logger.debug(`Fetching hot posts from: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AREA-Application/1.0',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Reddit API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as RedditApiResponse;

      return data.data.children.map((child) => child.data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch hot posts from r/${subreddit}: ${errorMessage}`,
      );
      throw error;
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
        await this.servicesService.refreshServiceToken(
          userId,
          redditService.id,
        );

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
      this.logger.error(`Failed to get Reddit access token: ${errorMessage}`);
      throw error;
    }
  }
}
