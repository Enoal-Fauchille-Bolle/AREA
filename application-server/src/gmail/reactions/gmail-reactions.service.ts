import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaExecutionsService } from '../../area-executions/area-executions.service';
import { AreaParametersService } from '../../area-parameters/area-parameters.service';
import { UserServicesService } from '../../user-services/user-services.service';
import { ServicesService } from '../../services/services.service';
import { Area } from '../../areas/entities/area.entity';

interface SendGmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

interface GmailSendResponse {
  id: string;
  threadId: string;
  labelIds: string[];
}

@Injectable()
export class GmailReactionsService {
  private readonly logger = new Logger(GmailReactionsService.name);
  private readonly gmailApiUrl = 'https://gmail.googleapis.com/gmail/v1';

  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
    private readonly userServicesService: UserServicesService,
    private readonly servicesService: ServicesService,
  ) {}

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
      const userService =
        await this.userServicesService.findUserServiceConnection(
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
        const refreshedUserService =
          await this.userServicesService.findUserServiceConnection(
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
