import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('webhooks/github')
export class GithubController {
  private readonly logger = new Logger(GithubController.name);

  constructor(private readonly githubService: GithubService) {}

  /**
   * GitHub webhook endpoint
   * Handles various GitHub events: push, pull_request, issues
   */
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-github-delivery') delivery: string,
    @Body() payload: unknown,
  ): Promise<{ message: string }> {
    this.logger.log(`Received GitHub webhook: ${event} (${delivery})`);

    if (!event) {
      throw new BadRequestException('Missing X-GitHub-Event header');
    }

    try {
      switch (event) {
        case 'push':
          if (!GithubService.isValidPushEvent(payload)) {
            throw new BadRequestException(
              'Invalid payload structure for push event',
            );
          }
          await this.githubService.handlePushEvent(payload);
          break;

        case 'pull_request':
          if (!GithubService.isValidPullRequestEvent(payload)) {
            throw new BadRequestException(
              'Invalid payload structure for pull_request event',
            );
          }
          await this.githubService.handlePullRequestEvent(payload);
          break;

        case 'issues':
          if (!GithubService.isValidIssueEvent(payload)) {
            throw new BadRequestException(
              'Invalid payload structure for issues event',
            );
          }
          await this.githubService.handleIssueEvent(payload);
          break;

        case 'ping':
          this.logger.log('GitHub webhook ping received');
          return { message: 'pong' };

        default:
          this.logger.log(`Ignoring unsupported GitHub event: ${event}`);
          return { message: `Event ${event} not handled` };
      }

      return { message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(
        `Error processing GitHub webhook ${event}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
