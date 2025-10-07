import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { ComponentsService } from '../components/components.service';

@Injectable()
export class ReactionProcessorService {
  private readonly logger = new Logger(ReactionProcessorService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly componentsService: ComponentsService,
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
          await this.emailService.processReaction(executionId, areaId);
          break;

        // Add more reaction types here as you create them:
        // case 'send_sms':
        //   await this.smsService.processReaction(executionId, areaId);
        //   break;
        // case 'post_to_slack':
        //   await this.slackService.processReaction(executionId, areaId);
        //   break;

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
