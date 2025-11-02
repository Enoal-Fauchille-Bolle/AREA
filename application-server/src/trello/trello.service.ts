import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  idBoard: string;
  url: string;
  dateLastActivity: string;
}

@Injectable()
export class TrelloService {
  private readonly logger = new Logger(TrelloService.name);
  private readonly trelloApiUrl = 'https://api.trello.com/1';
  private readonly trelloApiKey: string | undefined;

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
    private readonly configService: ConfigService,
  ) {
    const appConfig = this.configService.get('app');
    this.trelloApiKey = appConfig.oauth2.trello.apiKey;
  }

  /**
   * Cron job to check for new cards in lists every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkNewCards(): Promise<void> {
    this.logger.debug('Checking for new cards in Trello lists...');

    try {
      const areas =
        await this.areasService.findByActionComponent('new_card_in_list');

      for (const area of areas) {
        await this.checkNewCardsForArea(area);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error checking new cards: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Cron job to check for card movements every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkCardMoves(): Promise<void> {
    this.logger.debug('Checking for card movements in Trello...');

    try {
      const areas =
        await this.areasService.findByActionComponent('card_moved_to_list');

      for (const area of areas) {
        await this.checkCardMovesForArea(area);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error checking card movements: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async checkNewCardsForArea(area: Area): Promise<void> {
    try {
      const userId = area.user_id;

      // Get user's Trello token
      const { apiKey, token } = await this.getUserTrelloCredentials(userId);

      // Get list ID parameter
      const listId = await this.getListIdParameter(area.id);
      if (!listId) {
        this.logger.warn(`No list ID configured for area ${area.id}, skipping`);
        return;
      }

      this.logger.debug(
        `Checking new cards in list ${listId} for area ${area.id}`,
      );

      // Get last checked timestamp from hook state
      const hookStateKey = `trello_new_card_${area.id}_${listId}`;
      const lastCheckTimestamp = await this.hookStatesService.getState(
        area.id,
        hookStateKey,
      );
      const lastCheckTime = lastCheckTimestamp
        ? new Date(parseInt(lastCheckTimestamp))
        : new Date(Date.now() - 60000); // Default to 1 minute ago

      // Fetch cards from list
      const cards = await this.fetchCardsFromList(listId, apiKey, token);

      if (cards.length === 0) {
        this.logger.debug(`No cards found in list ${listId}`);
        return;
      }

      // Extract creation timestamp from card ID and filter new cards
      const newCards = cards
        .map((card) => ({
          ...card,
          createdAt: this.getCardCreationTime(card.id),
        }))
        .filter((card) => card.createdAt > lastCheckTime)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first

      if (newCards.length === 0) {
        this.logger.debug(`No new cards in list ${listId} since last check`);
        return;
      }

      // Process the newest card
      const latestCard = newCards[0];

      // New card detected!
      this.logger.log(
        `New card detected in list ${listId}: "${latestCard.name}" (created at ${latestCard.createdAt.toISOString()})`,
      );

      // Create execution
      const execution = await this.areaExecutionsService.create({
        areaId: area.id,
        status: ExecutionStatus.PENDING,
        triggerData: {
          card_id: latestCard.id,
          card_name: latestCard.name,
          card_description: latestCard.desc,
          card_url: latestCard.url,
          list_id: latestCard.idList,
          board_id: latestCard.idBoard,
          created_at: latestCard.createdAt.toISOString(),
        },
      });

      // Update hook state with the current timestamp
      await this.hookStatesService.setState(
        area.id,
        hookStateKey,
        Date.now().toString(),
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
        `Error checking new cards for area ${area.id}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * Extract creation timestamp from Trello card ID
   * Trello IDs are 24-character hex strings where the first 8 characters represent
   * the Unix timestamp in seconds when the card was created
   */
  private getCardCreationTime(cardId: string): Date {
    const timestamp = parseInt(cardId.substring(0, 8), 16);
    return new Date(timestamp * 1000);
  }

  private async checkCardMovesForArea(area: Area): Promise<void> {
    try {
      const userId = area.user_id;

      // Get user's Trello token
      const { apiKey, token } = await this.getUserTrelloCredentials(userId);

      // Get parameters
      const parameters = await this.areaParametersService.findByArea(area.id);
      const boardIdParam = parameters.find(
        (p) => p.variable?.name === 'board_id',
      );
      const targetListIdParam = parameters.find(
        (p) => p.variable?.name === 'target_list_id',
      );

      if (!boardIdParam?.value || !targetListIdParam?.value) {
        this.logger.warn(`Missing parameters for area ${area.id}, skipping`);
        return;
      }

      const targetListId = targetListIdParam.value;

      this.logger.debug(
        `Checking for cards moved to list ${targetListId} for area ${area.id}`,
      );

      // Get last checked timestamp
      const hookStateKey = `trello_card_moved_${area.id}_${targetListId}`;
      const lastCheck = await this.hookStatesService.getState(
        area.id,
        hookStateKey,
      );
      const lastCheckTime = lastCheck
        ? new Date(lastCheck)
        : new Date(Date.now() - 60000);

      // Fetch cards from target list
      const cards = await this.fetchCardsFromList(targetListId, apiKey, token);

      // Filter cards that were moved recently
      const recentlyMovedCards = cards.filter((card) => {
        const cardDate = new Date(card.dateLastActivity);
        return cardDate > lastCheckTime;
      });

      if (recentlyMovedCards.length === 0) {
        this.logger.debug(`No recently moved cards in list ${targetListId}`);
        await this.hookStatesService.setState(
          area.id,
          hookStateKey,
          new Date().toISOString(),
        );
        return;
      }

      // Process the most recent card
      const movedCard = recentlyMovedCards[0];
      this.logger.log(
        `Card moved to list ${targetListId}: "${movedCard.name}"`,
      );

      // Create execution
      const execution = await this.areaExecutionsService.create({
        areaId: area.id,
        status: ExecutionStatus.PENDING,
        triggerData: {
          card_id: movedCard.id,
          card_name: movedCard.name,
          card_description: movedCard.desc,
          card_url: movedCard.url,
          list_id: movedCard.idList,
          board_id: movedCard.idBoard,
          moved_at: movedCard.dateLastActivity,
        },
      });

      // Update hook state
      await this.hookStatesService.setState(
        area.id,
        hookStateKey,
        new Date().toISOString(),
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
        `Error checking card movements for area ${area.id}: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async getListIdParameter(areaId: number): Promise<string | null> {
    try {
      const parameters = await this.areaParametersService.findByArea(areaId);
      const listIdParam = parameters.find(
        (p) => p.variable?.name === 'list_id',
      );
      return listIdParam?.value || null;
    } catch (error) {
      this.logger.error(
        `Failed to get list ID parameter for area ${areaId} (${error})`,
      );
      return null;
    }
  }

  private async fetchCardsFromList(
    listId: string,
    apiKey: string,
    token: string,
  ): Promise<TrelloCard[]> {
    try {
      const url = `${this.trelloApiUrl}/lists/${listId}/cards?key=${apiKey}&token=${token}`;

      this.logger.debug(`Fetching cards from list: ${listId}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Trello API error: ${response.status} ${response.statusText}`,
        );
      }

      const cards = (await response.json()) as TrelloCard[];
      return cards;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch cards from list ${listId}: ${errorMessage}`,
      );
      throw error;
    }
  }

  async getUserTrelloCredentials(
    userId: number,
  ): Promise<{ apiKey: string; token: string }> {
    try {
      // Find Trello service
      const services = await this.servicesService.findAll();
      const trelloService = services.find(
        (s) => s.name.toLowerCase() === 'trello',
      );

      if (!trelloService) {
        throw new Error('Trello service not found');
      }

      // Get user's Trello service connection
      const userService = await this.userServicesService.findOne(
        userId,
        trelloService.id,
      );

      if (!userService || !userService.oauth_token) {
        throw new Error(
          'User has not connected their Trello account or token is missing',
        );
      }

      // Trello uses API Key + Token authentication
      const apiKey = this.trelloApiKey;
      if (!apiKey) {
        throw new Error('Trello API Key is not configured on the server');
      }
      const token = userService.oauth_token;

      return { apiKey, token };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to get Trello credentials: ${errorMessage}`,
      );
    }
  }
}
