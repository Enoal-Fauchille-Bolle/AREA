import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { ConfigService } from '@nestjs/config';

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class RealEmailService {
  private readonly logger = new Logger(RealEmailService.name);
  private readonly transporter: Transporter;
  private readonly smtpUser: string;
  private readonly smtpPass: string;

  constructor(
    private readonly areaExecutionsService: AreaExecutionsService,
    private readonly areaParametersService: AreaParametersService,
    private readonly configService: ConfigService,
  ) {
    const appService = this.configService.get('app');
    this.smtpUser = appService.email.smtpUser!;
    this.smtpPass = appService.email.smtpPass!;

    if (!this.smtpUser || !this.smtpPass) {
      this.logger.warn(
        'SMTP_USER and SMTP_PASS not set - real email sending will fail',
      );
    }

    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        user: this.smtpUser || 'dummy@example.com',
        pass: this.smtpPass || 'dummy-pass',
      },
    });
  }

  async sendEmail(executionId: number, areaId: number): Promise<void> {
    try {
      this.logger.log(
        `Processing real email send for execution ${executionId}, area ${areaId}`,
      );

      // Get email parameters from the area
      const emailParams = await this.getEmailParameters(areaId, executionId);

      if (!emailParams) {
        throw new Error('Email parameters not configured');
      }

      // Send real email
      await this.transporter.sendMail({
        from: this.smtpUser,
        to: emailParams.to,
        subject: emailParams.subject,
        text: emailParams.body,
      });

      // Update execution as successful
      await this.areaExecutionsService.completeExecution(executionId, {
        executionResult: {
          message: `Real email sent successfully to ${emailParams.to}`,
          email_recipient: emailParams.to,
          email_subject: emailParams.subject,
        },
      });

      this.logger.log(
        `Real email sent successfully to ${emailParams.to} for execution ${executionId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send real email for execution ${executionId}: ${errorMessage}`,
        errorStack,
      );

      // Update execution as failed
      await this.areaExecutionsService.failExecution(executionId, errorMessage);
    }
  }

  private async getEmailParameters(
    areaId: number,
    executionId?: number,
  ): Promise<EmailParams | null> {
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

      const toParam = parameters.find((p) => p.variable?.name === 'to');
      const subjectParam = parameters.find(
        (p) => p.variable?.name === 'subject',
      );
      const bodyParam = parameters.find((p) => p.variable?.name === 'body');

      if (!toParam?.value) {
        throw new Error('Email recipient (to) not configured');
      }

      return {
        to: toParam.value,
        subject: subjectParam?.value || 'AREA Notification',
        body: bodyParam?.value || 'Your AREA was triggered successfully.',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to get email parameters for area ${areaId}: ${errorMessage}`,
      );
      return null;
    }
  }

  async processReaction(executionId: number, areaId: number): Promise<void> {
    await this.sendEmail(executionId, areaId);
  }
}
