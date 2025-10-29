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
import { ReactionProcessorService } from '../common/reaction-processor.service';

interface SendGmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
  };
  internalDate: string;
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

interface GmailSendResponse {
  id: string;
  threadId: string;
  labelIds: string[];
}

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly gmailApiUrl = 'https://gmail.googleapis.com/gmail/v1';

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
   * Cron job to check for new emails every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkNewEmails(): Promise<void> {
    this.logger.debug('Checking for new emails across all areas...');

    try {
      // Find all areas with new_email_received action
      const areas =
        await this.areasService.findByActionComponent('new_email_received');

      for (const area of areas) {
        await this.checkNewEmailsForArea(area);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error checking new emails: ${errorMessage}`,
        errorStack,
      );
    }
  }

  private async checkNewEmailsForArea(area: Area): Promise<void> {
    try {
      const userId = area.user_id;

      // Get user's Gmail access token
      const accessToken = await this.getUserGmailToken(userId);

      // Get filter parameters
      const parameters = await this.areaParametersService.findByArea(area.id);
      const fromParam = parameters.find((p) => p.variable?.name === 'from');
      const subjectParam = parameters.find(
        (p) => p.variable?.name === 'subject_contains',
      );

      // Build Gmail query
      let query = 'is:unread';
      if (fromParam?.value) {
        query += ` from:${fromParam.value}`;
      }
      if (subjectParam?.value) {
        query += ` subject:${subjectParam.value}`;
      }

      // Get the last checked message ID from hook state
      const stateKey = `new_email_last_id_${area.id}`;
      const lastState = await this.hookStatesService.getState(
        area.id,
        stateKey,
      );
      const lastMessageId = lastState || null;

      // Fetch messages from Gmail API
      const messages = await this.fetchGmailMessages(
        accessToken,
        query,
        lastMessageId,
      );

      if (messages.length === 0) {
        this.logger.debug(`No new emails for area ${area.id}`);
        return;
      }

      this.logger.log(
        `Found ${messages.length} new email(s) for area ${area.id}`,
      );

      // Process only the newest (first) email to avoid triggering multiple reactions
      // Note: Gmail API returns messages in reverse chronological order (newest first)
      if (messages[0]) {
        const message = messages[0];

        // Store the newest message ID
        await this.hookStatesService.setState(area.id, stateKey, message.id);

        const messageDetails = await this.fetchMessageDetails(
          accessToken,
          message.id,
        );

        const executionData = {
          email_id: messageDetails.id,
          from: this.getHeader(messageDetails, 'From'),
          to: this.getHeader(messageDetails, 'To'),
          subject: this.getHeader(messageDetails, 'Subject'),
          snippet: messageDetails.snippet,
          received_at: new Date(
            parseInt(messageDetails.internalDate),
          ).toISOString(),
        };

        // Create execution for this trigger
        const execution = await this.areaExecutionsService.create({
          areaId: area.id,
          triggerData: executionData,
          startedAt: new Date(),
        });

        // Process the reaction
        await this.reactionProcessorService.processReaction(
          area.component_reaction_id,
          execution.id,
          area.id,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to check new emails for area ${area.id}: ${errorMessage}`,
      );
    }
  }

  private async fetchGmailMessages(
    accessToken: string,
    query: string,
    afterMessageId: string | null,
  ): Promise<Array<{ id: string; threadId: string }>> {
    try {
      const params = new URLSearchParams({
        q: query,
        maxResults: '1', // Fetch only the newest email to avoid processing multiple at once
      });

      const response = await fetch(
        `${this.gmailApiUrl}/users/me/messages?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Gmail API error: ${response.status} - ${errorData}`,
        );
      }

      const data = (await response.json()) as GmailListResponse;
      let messages = data.messages || [];

      // Filter messages to only include those after the last checked message
      if (afterMessageId) {
        const afterIndex = messages.findIndex((m) => m.id === afterMessageId);
        if (afterIndex !== -1) {
          messages = messages.slice(0, afterIndex);
        }
      }

      return messages;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to fetch Gmail messages: ${errorMessage}`,
      );
    }
  }

  private async fetchMessageDetails(
    accessToken: string,
    messageId: string,
  ): Promise<GmailMessage> {
    try {
      const response = await fetch(
        `${this.gmailApiUrl}/users/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Gmail API error: ${response.status} - ${errorData}`,
        );
      }

      return (await response.json()) as GmailMessage;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to fetch message details: ${errorMessage}`,
      );
    }
  }

  private getHeader(message: GmailMessage, headerName: string): string {
    const header = message.payload.headers.find(
      (h) => h.name.toLowerCase() === headerName.toLowerCase(),
    );
    return header?.value || '';
  }

  /**
   * Send email via Gmail API (REACTION)
   */
  async sendEmail(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing send Gmail for execution ${executionId}, area ${areaId}`,
      );

      // Get the area to find the user
      const area = await this.areaRepository.findOne({
        where: { id: areaId },
      });

      if (!area) {
        throw new Error(`Area with ID ${areaId} not found`);
      }

      const userId = area.user_id;

      // Get email parameters
      const emailParams = await this.getEmailParameters(areaId);

      if (!emailParams) {
        throw new Error('Send Gmail parameters not configured');
      }

      // Get user's Gmail OAuth token
      const accessToken = await this.getUserGmailToken(userId);

      // Send email via Gmail API
      const sentMessage = await this.sendGmailMessage(accessToken, emailParams);

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Gmail sent successfully to ${emailParams.to}`,
          message_id: sentMessage.id,
          thread_id: sentMessage.threadId,
          sent_at: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Gmail sent successfully to ${emailParams.to} for execution ${executionId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send Gmail for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      // Update execution as failed
      await this.areaExecutionsService.failExecution(executionId, errorMessage);
    }
  }

  private async sendGmailMessage(
    accessToken: string,
    params: SendGmailParams,
  ): Promise<GmailSendResponse> {
    try {
      // Build RFC 2822 formatted email
      const email = [
        `To: ${params.to}`,
        params.cc ? `Cc: ${params.cc}` : '',
        params.bcc ? `Bcc: ${params.bcc}` : '',
        `Subject: ${params.subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        params.body,
      ]
        .filter((line) => line !== '')
        .join('\r\n');

      // Encode email in base64url format
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send via Gmail API
      const response = await fetch(
        `${this.gmailApiUrl}/users/me/messages/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            raw: encodedEmail,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Gmail API error: ${response.status} - ${errorData}`,
        );
      }

      const messageData = (await response.json()) as GmailSendResponse;

      return messageData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to send Gmail message: ${errorMessage}`,
      );
    }
  }

  private async getUserGmailToken(userId: number): Promise<string> {
    try {
      // Find Gmail service
      const services = await this.servicesService.findAll();
      const gmailService = services.find(
        (s) => s.name.toLowerCase() === 'gmail',
      );

      if (!gmailService) {
        throw new Error('Gmail service not found');
      }

      // Get user's Gmail service connection
      const userService = await this.userServicesService.findOne(
        userId,
        gmailService.id,
      );

      if (!userService || !userService.oauth_token) {
        throw new Error(
          'User has not connected their Gmail account or token is missing',
        );
      }

      // Check if token is expired and refresh if needed
      if (
        userService.token_expires_at &&
        new Date(userService.token_expires_at) <= new Date()
      ) {
        this.logger.log(
          `Gmail token expired for user ${userId}, refreshing...`,
        );
        await this.servicesService.refreshServiceToken(userId, gmailService.id);

        // Fetch the updated token
        const refreshedUserService = await this.userServicesService.findOne(
          userId,
          gmailService.id,
        );

        if (!refreshedUserService || !refreshedUserService.oauth_token) {
          throw new Error('Failed to refresh Gmail access token');
        }

        return refreshedUserService.oauth_token;
      }

      return userService.oauth_token;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to get Gmail token for user ${userId}: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async getEmailParameters(
    areaId: number,
  ): Promise<SendGmailParams | null> {
    try {
      const parameters = await this.areaParametersService.findByArea(areaId);

      const toParam = parameters.find((p) => p.variable?.name === 'to');
      const subjectParam = parameters.find(
        (p) => p.variable?.name === 'subject',
      );
      const bodyParam = parameters.find((p) => p.variable?.name === 'body');
      const ccParam = parameters.find((p) => p.variable?.name === 'cc');
      const bccParam = parameters.find((p) => p.variable?.name === 'bcc');

      if (!toParam?.value || !subjectParam?.value || !bodyParam?.value) {
        throw new Error(
          'Required Gmail parameters (to, subject, body) are not set',
        );
      }

      return {
        to: toParam.value,
        subject: subjectParam.value,
        body: bodyParam.value,
        cc: ccParam?.value || undefined,
        bcc: bccParam?.value || undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to get Gmail parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  async processReaction(executionId: number, areaId: number): Promise<void> {
    await this.sendEmail(executionId, areaId);
  }
}
