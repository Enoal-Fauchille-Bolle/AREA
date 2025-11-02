import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaExecutionsService } from '../../area-executions/area-executions.service';
import { AreaParametersService } from '../../area-parameters/area-parameters.service';
import { UserServicesService } from '../../services/user-services/user-services.service';
import { ServicesService } from '../../services/services.service';
import { Area } from '../../areas/entities/area.entity';

interface CreateCardParams {
  list_id: string;
  card_name: string;
  card_description: string;
}

interface MoveCardParams {
  card_id: string;
  target_list_id: string;
}

interface TrelloCardResponse {
  id: string;
  name: string;
  url: string;
  idList: string;
}

@Injectable()
export class TrelloReactionsService {
  private readonly logger = new Logger(TrelloReactionsService.name);
  private readonly trelloApiUrl = 'https://api.trello.com/1';
  private readonly trelloApiKey: string | undefined;

  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
    private readonly userServicesService: UserServicesService,
    private readonly servicesService: ServicesService,
    private readonly configService: ConfigService,
  ) {
    const appConfig = this.configService.get('app');
    this.trelloApiKey = appConfig.oauth2.trello.apiKey;
  }

  /**
   * Create a card in a Trello list (REACTION)
   */
  async createCard(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing Trello create_card for execution ${executionId}, area ${areaId}`,
      );

      // Get the area to find the user
      const area = await this.areaRepository.findOne({
        where: { id: areaId },
      });

      if (!area) {
        throw new Error(`Area with ID ${areaId} not found`);
      }

      const userId = area.user_id;

      // Get user's Trello credentials
      const { apiKey, token } = await this.getUserTrelloCredentials(userId);

      // Get card parameters
      const cardParams = await this.getCreateCardParameters(
        areaId,
        executionId,
      );

      if (!cardParams) {
        throw new Error('Trello card parameters not configured');
      }

      this.logger.debug(`Creating card in list ${cardParams.list_id}`);
      this.logger.debug(`Card name: ${cardParams.card_name}`);

      // Create card via Trello API
      const createdCard = await this.submitTrelloCard(
        apiKey,
        token,
        cardParams.list_id,
        cardParams.card_name,
        cardParams.card_description,
      );

      this.logger.log(
        `Card created successfully in list ${cardParams.list_id}: ${createdCard.url}`,
      );

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Card created successfully in Trello list`,
          card_id: createdCard.id,
          card_name: createdCard.name,
          card_url: createdCard.url,
          list_id: createdCard.idList,
        },
      });

      this.logger.log(`Card created successfully for execution ${executionId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to create Trello card for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      // Update execution as failed
      await this.areaExecutionsService.failExecution(executionId, errorMessage);
    }
  }

  /**
   * Move a card to another list (REACTION)
   */
  async moveCard(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing Trello move_card for execution ${executionId}, area ${areaId}`,
      );

      // Get the area to find the user
      const area = await this.areaRepository.findOne({
        where: { id: areaId },
      });

      if (!area) {
        throw new Error(`Area with ID ${areaId} not found`);
      }

      const userId = area.user_id;

      // Get user's Trello credentials
      const { apiKey, token } = await this.getUserTrelloCredentials(userId);

      // Get move parameters
      const moveParams = await this.getMoveCardParameters(areaId, executionId);

      if (!moveParams) {
        throw new Error('Trello move card parameters not configured');
      }

      this.logger.debug(
        `Moving card ${moveParams.card_id} to list ${moveParams.target_list_id}`,
      );

      // Move card via Trello API
      const movedCard = await this.moveTrelloCard(
        apiKey,
        token,
        moveParams.card_id,
        moveParams.target_list_id,
      );

      this.logger.log(
        `Card moved successfully to list ${moveParams.target_list_id}: ${movedCard.url}`,
      );

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Card moved successfully to target list`,
          card_id: movedCard.id,
          card_name: movedCard.name,
          card_url: movedCard.url,
          target_list_id: movedCard.idList,
        },
      });

      this.logger.log(`Card moved successfully for execution ${executionId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to move Trello card for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      // Update execution as failed
      await this.areaExecutionsService.failExecution(executionId, errorMessage);
    }
  }

  /**
   * Submit a card to Trello via API
   */
  private async submitTrelloCard(
    apiKey: string,
    token: string,
    listId: string,
    name: string,
    description: string,
  ): Promise<TrelloCardResponse> {
    try {
      const url = `${this.trelloApiUrl}/cards?key=${apiKey}&token=${token}`;

      const body = {
        idList: listId,
        name: name,
        desc: description,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Trello API error: ${response.status} - ${errorData}`,
        );
      }

      const result = (await response.json()) as TrelloCardResponse;
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create Trello card: ${errorMessage}`,
      );
    }
  }

  /**
   * Move a card to another list via Trello API
   */
  private async moveTrelloCard(
    apiKey: string,
    token: string,
    cardId: string,
    targetListId: string,
  ): Promise<TrelloCardResponse> {
    try {
      const url = `${this.trelloApiUrl}/cards/${cardId}?key=${apiKey}&token=${token}`;

      const body = {
        idList: targetListId,
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Trello API error: ${response.status} - ${errorData}`,
        );
      }

      const result = (await response.json()) as TrelloCardResponse;
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to move Trello card: ${errorMessage}`,
      );
    }
  }

  /**
   * Get user's Trello API credentials
   */
  private async getUserTrelloCredentials(
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

      // Trello uses API Key + Token
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

  private async getCreateCardParameters(
    areaId: number,
    executionId?: number,
  ): Promise<CreateCardParams | null> {
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

      const listIdParam = parameters.find(
        (p) => p.variable?.name === 'list_id',
      );
      const cardNameParam = parameters.find(
        (p) => p.variable?.name === 'card_name',
      );
      const cardDescParam = parameters.find(
        (p) => p.variable?.name === 'card_description',
      );

      if (!listIdParam?.value || !cardNameParam?.value) {
        throw new Error('Required Trello card parameters not configured');
      }

      return {
        list_id: listIdParam.value,
        card_name: cardNameParam.value,
        card_description: cardDescParam?.value || '',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to get Trello card parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  private async getMoveCardParameters(
    areaId: number,
    executionId?: number,
  ): Promise<MoveCardParams | null> {
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

      const cardIdParam = parameters.find(
        (p) => p.variable?.name === 'card_id',
      );
      const targetListIdParam = parameters.find(
        (p) => p.variable?.name === 'target_list_id',
      );

      if (!cardIdParam?.value || !targetListIdParam?.value) {
        throw new Error('Required Trello move card parameters not configured');
      }

      return {
        card_id: cardIdParam.value,
        target_list_id: targetListIdParam.value,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to get Trello move card parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  async processReaction(executionId: number, areaId: number): Promise<void> {
    // Determine which reaction to process based on component
    const area = await this.areaRepository.findOne({
      where: { id: areaId },
      relations: ['componentReaction'],
    });

    if (!area || !area.componentReaction) {
      throw new Error('Area or reaction component not found');
    }

    const componentName = area.componentReaction.name;

    if (componentName === 'create_card') {
      await this.createCard(executionId, areaId);
    } else if (componentName === 'move_card') {
      await this.moveCard(executionId, areaId);
    } else {
      throw new Error(`Unknown Trello reaction: ${componentName}`);
    }
  }
}
