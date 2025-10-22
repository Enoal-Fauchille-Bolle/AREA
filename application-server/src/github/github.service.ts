import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../areas/entities/area.entity';
import { HookStatesService } from '../hook-states/hook-states.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { ExecutionStatus } from '../area-executions/entities/area-execution.entity';
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
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
    committer: {
      name: string;
      email: string;
      username?: string;
    };
  }>;
  head_commit?: {
    id: string;
    message: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
    committer: {
      name: string;
      email: string;
      username?: string;
    };
  };
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
    milestone?: {
      id: number;
      title: string;
      description: string;
      html_url: string;
    } | null;
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
      this.logger.log(
        `Found ${areas.length} active areas with push_event component`,
      );

      for (const area of areas) {
        try {
          this.logger.log(
            `Checking area ${area.id} (${area.name}) for repository match`,
          );

          // Check if this area's repository matches the webhook repository
          const shouldTrigger = await this.checkRepositoryMatch(
            area.id,
            payload.repository.full_name,
          );

          if (shouldTrigger) {
            this.logger.log(
              `Repository match found for area ${area.id}, triggering...`,
            );

            // Use head_commit from payload if available, otherwise first commit
            const headCommit =
              payload.head_commit || payload.commits[0] || null;

            await this.triggerArea(area, {
              // Event metadata
              event_type: 'push',
              repository_name: payload.repository.full_name,
              pusher_name: payload.pusher.name,
              commits_count: payload.commits.length,

              // Head commit details (output variables)
              head_commit_branch: branch,
              head_commit_message: headCommit?.message || '',
              head_commit_date:
                headCommit?.timestamp || new Date().toISOString(),
              head_commit_url: headCommit?.url || '',
              head_commit_id: headCommit?.id || '',
              head_commit_author_username:
                headCommit?.author?.username ||
                headCommit?.author?.name ||
                payload.pusher.name,

              // Legacy support (keep for backwards compatibility)
              repository: payload.repository.full_name,
              branch: branch,
              pusher: payload.pusher.name,
              latest_commit: headCommit
                ? {
                    id: headCommit.id.substring(0, 7),
                    message: headCommit.message,
                    author: headCommit.author.name,
                  }
                : null,
            });
          } else {
            this.logger.log(
              `No repository match for area ${area.id}, skipping`,
            );
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
              repository_name: payload.repository.full_name,
              pr_number: payload.pull_request.number,
              pr_title: payload.pull_request.title,
              pr_body: payload.pull_request.body || '',
              pr_link: payload.pull_request.html_url,
              pr_author_username: payload.pull_request.user.login,
              pr_head_branch: payload.pull_request.head.ref,
              pr_base_branch: payload.pull_request.base.ref,

              // Legacy support (keep for backwards compatibility)
              repository: payload.repository.full_name,
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
              repository_name: payload.repository.full_name,
              issue_number: payload.issue.number,
              issue_title: payload.issue.title,
              issue_body: payload.issue.body || '',
              issue_link: payload.issue.html_url,
              issue_author_username: payload.issue.user.login,
              issue_milestone: payload.issue.milestone?.title || '',
              issue_labels: payload.issue.labels.map((l) => l.name).join(', '),

              // Legacy support (keep for backwards compatibility)
              repository: payload.repository.full_name,
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
      .innerJoin('area.componentAction', 'component')
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

      // Create execution record with trigger data
      const execution = await this.areaExecutionsService.create({
        areaId: area.id,
        triggerData: eventData, // Pass the GitHub event data as trigger data
        status: ExecutionStatus.PENDING,
        startedAt: new Date(),
      });

      // Mark execution as started
      await this.areaExecutionsService.startExecution(execution.id);

      // Update hook state with last triggered time (create if doesn't exist)
      await this.hookStatesService.setState(
        area.id,
        'github_webhook',
        new Date().toISOString(),
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
