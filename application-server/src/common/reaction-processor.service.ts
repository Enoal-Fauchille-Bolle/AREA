import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { FakeEmailService } from '../email/email.service';
import { RealEmailService } from '../email/real-email.service';
import { ComponentsService } from '../components/components.service';
import { DiscordService } from '../discord/discord.service';
import { GmailReactionsService } from '../gmail/reactions/gmail-reactions.service';
import { TwitchReactionsService } from '../twitch/reactions/twitch-reactions.service';
import { RedditReactionsService } from '../reddit/reactions/reddit-reactions.service';
import { SpotifyService } from '../spotify/spotify.service';
import { TrelloReactionsService } from '../trello/reactions/trello-reactions.service';

@Injectable()
export class ReactionProcessorService {
  private readonly logger = new Logger(ReactionProcessorService.name);

  constructor(
    private readonly fakeEmailService: FakeEmailService,
    private readonly realEmailService: RealEmailService,
    private readonly componentsService: ComponentsService,
    @Inject(forwardRef(() => DiscordService))
    private readonly discordService: DiscordService,
    private readonly gmailReactionsService: GmailReactionsService,
    private readonly twitchReactionsService: TwitchReactionsService,
    private readonly redditReactionsService: RedditReactionsService,
    private readonly spotifyService: SpotifyService,
    private readonly trelloReactionsService: TrelloReactionsService,
  ) {}

  async processReaction(
    componentReactionId: number,
    executionId: number,
    areaId: number,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing reaction component ${componentReactionId} for execution ${executionId}`,
      );

      // Get the reaction component details
      const component =
        await this.componentsService.findOne(componentReactionId);

      if (!component) {
        throw new Error(`Reaction component ${componentReactionId} not found`);
      }

      // Route to appropriate service based on component name

      switch (component.name) {
        case 'send_email':
          await this.realEmailService.processReaction(executionId, areaId);
          break;
        case 'fake_email':
          await this.fakeEmailService.processReaction(executionId, areaId);
          break;
        case 'send_message':
          await this.discordService.sendMessageReaction(executionId, areaId);
          break;
        case 'react_to_message':
          await this.discordService.reactToMessageReaction(executionId, areaId);
          break;
        case 'send_gmail':
          await this.gmailReactionsService.processReaction(executionId, areaId);
          break;
        case 'send_chat_message':
          await this.twitchReactionsService.processReaction(
            executionId,
            areaId,
          );
          break;
        case 'create_reddit_post':
          await this.redditReactionsService.processReaction(
            executionId,
            areaId,
          );
          break;
        case 'add_to_playlist':
          await this.spotifyService.addToPlaylistReaction(executionId, areaId);
          break;
        case 'add_to_queue':
          await this.spotifyService.addToQueueReaction(executionId, areaId);
          break;
        case 'create_card':
          await this.trelloReactionsService.createCard(executionId, areaId);
          break;
        case 'move_card':
          await this.trelloReactionsService.moveCard(executionId, areaId);
          break;
        default:
          throw new Error(`Unknown reaction component: ${component.name}`);
      }

      this.logger.log(
        `Successfully processed reaction ${component.name} for execution ${executionId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to process reaction for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
