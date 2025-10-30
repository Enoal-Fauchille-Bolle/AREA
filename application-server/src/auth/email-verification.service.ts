import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { randomInt } from 'crypto';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly transporter: Transporter;
  private readonly smtpUser: string;
  private readonly smtpPass: string;
  private readonly serverUrl: string;

  constructor(private readonly configService: ConfigService) {
    const appConfig = this.configService.get('app');
    this.smtpUser = appConfig.email.smtpUser!;
    this.smtpPass = appConfig.email.smtpPass!;
    this.serverUrl = appConfig.serverUrl;

    if (!this.smtpUser || !this.smtpPass) {
      this.logger.warn(
        'SMTP_USER and SMTP_PASS not set - email verification will not work properly',
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

  /**
   * Generate a random 6-digit verification code
   */
  generateVerificationCode(): string {
    return randomInt(100000, 999999).toString();
  }

  /**
   * Calculate expiration date (10 minutes from now)
   */
  getExpirationDate(): Date {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);
    return expiration;
  }

  /**
   * Send verification email with 6-digit code
   */
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.smtpUser,
        to: email,
        subject: 'Verify your AREA email address',
        text: `Welcome to AREA!

Your email verification code is: ${code}

This code will expire in 10 minutes.

If you didn't create an account with AREA, please ignore this email.

Best regards,
The AREA Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to AREA!</h1>
    </div>
    <div class="content">
      <p>Thank you for registering with AREA. To complete your registration, please verify your email address.</p>
      
      <p><strong>Your verification code is:</strong></p>
      <div class="code">${code}</div>
      
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      
      <p>If you didn't create an account with AREA, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>The AREA Team</p>
    </div>
  </div>
</body>
</html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send verification email to ${email}: ${errorMessage}`,
        errorStack,
      );
      throw new Error('Failed to send verification email');
    }
  }
}
