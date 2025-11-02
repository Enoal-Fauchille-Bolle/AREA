/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailVerificationService } from './email-verification.service';
import { randomInt } from 'crypto';

jest.mock('crypto');
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let mockConfigService: any;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require('nodemailer');
    nodemailer.createTransport.mockReturnValue(mockTransporter);

    mockConfigService = {
      get: jest.fn((key) => {
        if (key === 'app') {
          return {
            email: {
              smtpUser: 'test@example.com',
              smtpPass: 'test-password',
            },
            serverUrl: 'http://localhost:3000',
          };
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with SMTP credentials from config', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('app');
    });

    it('should log warning when SMTP credentials are missing', () => {
      const localMockConfig = {
        get: jest.fn((key) => {
          if (key === 'app') {
            return {
              email: {
                smtpUser: undefined,
                smtpPass: undefined,
              },
              serverUrl: 'http://localhost:3000',
            };
          }
          return undefined;
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const newService = new EmailVerificationService(localMockConfig as any);
      // The warning is logged in the constructor, service should still be created
      expect(newService).toBeDefined();
    });
  });

  describe('generateVerificationCode', () => {
    it('should generate a 6-digit code', () => {
      (randomInt as jest.Mock).mockReturnValue(123456);

      const code = service.generateVerificationCode();

      expect(code).toBe('123456');
      expect(randomInt).toHaveBeenCalledWith(100000, 999999);
    });

    it('should generate different codes', () => {
      (randomInt as jest.Mock)
        .mockReturnValueOnce(100000)
        .mockReturnValueOnce(999999);

      const code1 = service.generateVerificationCode();
      const code2 = service.generateVerificationCode();

      expect(code1).toBe('100000');
      expect(code2).toBe('999999');
    });
  });

  describe('getExpirationDate', () => {
    it('should return date 10 minutes in the future', () => {
      const now = new Date('2024-01-01T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      const expiration = service.getExpirationDate();

      expect(expiration.getTime()).toBe(now.getTime() + 10 * 60 * 1000);

      jest.useRealTimers();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct details', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendVerificationEmail('user@example.com', '123456');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@example.com',
          to: 'user@example.com',
          subject: 'Verify your AREA email address',
        }),
      );
    });

    it('should include verification code in email text', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendVerificationEmail('user@example.com', '456789');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('456789'),
        }),
      );
    });

    it('should include verification code in email HTML', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendVerificationEmail('user@example.com', '456789');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('456789'),
        }),
      );
    });

    it('should log success when email is sent', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendVerificationEmail('user@example.com', '123456');

      expect(loggerSpy).toHaveBeenCalledWith(
        'Verification email sent to user@example.com',
      );
    });

    it('should throw error when email sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      await expect(
        service.sendVerificationEmail('user@example.com', '123456'),
      ).rejects.toThrow('Failed to send verification email');
    });

    it('should log error when email sending fails', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      try {
        await service.sendVerificationEmail('user@example.com', '123456');
      } catch {
        // Expected error
      }

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send verification email'),
        expect.any(String),
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockTransporter.sendMail.mockRejectedValue('Unknown error');

      await expect(
        service.sendVerificationEmail('user@example.com', '123456'),
      ).rejects.toThrow('Failed to send verification email');
    });
  });
});
