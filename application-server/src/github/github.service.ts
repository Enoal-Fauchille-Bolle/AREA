import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../areas/entities/area.entity';
import { HookStatesService } from '../hook-states/hook-states.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { ReactionProcessorService } from '../common/reaction-processor.service';

interface GitHubPushEvent {
  ref: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  pusher: {
    name: string;
    email: string;
  };
  commits: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  }>;
}

interface GitHubPullRequestEvent {
  action: string;
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    html_url: string;
    user: {
      login: string;
    };
    head: {
      ref: string;
    };
    base: {
      ref: string;
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
}

interface GitHubIssueEvent {
  action: string;
  issue: {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    html_url: string;
    user: {
      login: string;
    };
    labels: Array<{
      name: string;
    }>;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly hookStatesService: HookStatesService,
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly reactionProcessorService: ReactionProcessorService,
  ) {}

  /**
   * Process GitHub push webhook event
   */
  async handlePushEvent(payload: GitHubPushEvent): Promise<void> {
    try {
      this.logger.log(
        `Received GitHub push event for repository: ${payload.repository.full_name}`,
      );

      // Extract branch name from ref (refs/heads/main -> main)
      const branch = payload.ref.replace('refs/heads/', '');

      // Find all active areas with push_event action component
      const areas = await this.findAreasForComponent('push_event');

      for (const area of areas) {
        try {
          // Check if this area's repository matches the webhook repository
          const shouldTrigger = await this.checkRepositoryMatch(
            area.id,
            payload.repository.full_name,
          );

          if (shouldTrigger) {
            await this.triggerArea(area, {
              event_type: 'push',
              repository: payload.repository.full_name,
              branch: branch,
              pusher: payload.pusher.name,
              commits_count: payload.commits.length,
              latest_commit: payload.commits[0]
                ? {
                    id: payload.commits[0].id.substring(0, 7),
                    message: payload.commits[0].message,
                    author: payload.commits[0].author.name,
                  }
                : null,
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to process push event for area ${area.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle GitHub push event: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process GitHub pull request webhook event
   */
  async handlePullRequestEvent(payload: GitHubPullRequestEvent): Promise<void> {
    try {
      this.logger.log(
        `Received GitHub pull request event (${payload.action}) for repository: ${payload.repository.full_name}`,
      );

      // Only trigger on "opened" action for new PRs
      if (payload.action !== 'opened') {
        this.logger.log(
          `Ignoring pull request action: ${payload.action} (only 'opened' triggers areas)`,
        );
        return;
      }

      // Find all active areas with pull_request_event action component
      const areas = await this.findAreasForComponent('pull_request_event');

      for (const area of areas) {
        try {
          // Check if this area's repository matches the webhook repository
          const shouldTrigger = await this.checkRepositoryMatch(
            area.id,
            payload.repository.full_name,
          );

          if (shouldTrigger) {
            await this.triggerArea(area, {
              event_type: 'pull_request',
              action: payload.action,
              repository: payload.repository.full_name,
              pr_number: payload.pull_request.number,
              pr_title: payload.pull_request.title,
              pr_url: payload.pull_request.html_url,
              author: payload.pull_request.user.login,
              head_branch: payload.pull_request.head.ref,
              base_branch: payload.pull_request.base.ref,
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to process pull request event for area ${area.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle GitHub pull request event: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process GitHub issue webhook event
   */
  async handleIssueEvent(payload: GitHubIssueEvent): Promise<void> {
    try {
      this.logger.log(
        `Received GitHub issue event (${payload.action}) for repository: ${payload.repository.full_name}`,
      );

      // Only trigger on "opened" action for new issues
      if (payload.action !== 'opened') {
        this.logger.log(
          `Ignoring issue action: ${payload.action} (only 'opened' triggers areas)`,
        );
        return;
      }

      // Find all active areas with issue_event action component
      const areas = await this.findAreasForComponent('issue_event');

      for (const area of areas) {
        try {
          // Check if this area's repository matches the webhook repository
          const shouldTrigger = await this.checkRepositoryMatch(
            area.id,
            payload.repository.full_name,
          );

          if (shouldTrigger) {
            await this.triggerArea(area, {
              event_type: 'issue',
              action: payload.action,
              repository: payload.repository.full_name,
              issue_number: payload.issue.number,
              issue_title: payload.issue.title,
              issue_url: payload.issue.html_url,
              author: payload.issue.user.login,
              labels: payload.issue.labels.map((l) => l.name).join(', '),
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to process issue event for area ${area.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle GitHub issue event: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ==================== PRIVATE HELPERS ====================

  private async findAreasForComponent(componentName: string): Promise<Area[]> {
    return this.areaRepository
      .createQueryBuilder('area')
      .innerJoin('area.component_action', 'component')
      .where('area.is_active = :isActive', { isActive: true })
      .andWhere('component.name = :componentName', { componentName })
      .andWhere('component.is_active = :isActive', { isActive: true })
      .getMany();
  }

  private async checkRepositoryMatch(
    areaId: number,
    repositoryFullName: string,
  ): Promise<boolean> {
    try {
      // Get area's repository configuration from hook state
      const configuredRepo = await this.hookStatesService.getState(
        areaId,
        'repository',
      );

      if (!configuredRepo) {
        // No specific repository configured, match all
        this.logger.log(
          `No repository configured for area ${areaId}, matching all repositories`,
        );
        return true;
      }

      return configuredRepo === repositoryFullName;
    } catch (error) {
      this.logger.error(
        `Error checking repository match for area ${areaId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async triggerArea(
    area: Area,
    eventData: Record<string, unknown>,
  ): Promise<void> {
    try {
      this.logger.log(`Triggering area ${area.id} (${area.name})`);

      // Create execution record
      const execution = await this.areaExecutionsService.startExecution(
        area.id,
      );

      // Update hook state with last triggered time
      await this.hookStatesService.updateLastChecked(
        area.id,
        'github_webhook',
        new Date(),
      );

      // Process the reaction
      await this.reactionProcessorService.processReaction(
        area.component_reaction_id,
        execution.id,
        area.id,
      );

      this.logger.log(
        `Successfully triggered area ${area.id} with GitHub event: ${eventData.event_type as string}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to trigger area ${area.id}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
