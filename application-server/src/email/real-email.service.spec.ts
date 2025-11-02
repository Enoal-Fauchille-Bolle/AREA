/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { RealEmailService } from './real-email.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('RealEmailService', () => {
  let service: RealEmailService;
  let mockAreaExecutionsService: any;
  let mockAreaParametersService: any;
  let mockConfigService: any;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    mockAreaExecutionsService = {
      create: jest.fn(),
      findOne: jest.fn(),
      completeExecution: jest.fn(),
      failExecution: jest.fn(),
    };

    mockAreaParametersService = {
      findOne: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue({
        email: {
          smtpUser: 'test@example.com',
          smtpPass: 'password123',
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealEmailService,
        {
          provide: AreaExecutionsService,
          useValue: mockAreaExecutionsService,
        },
        {
          provide: AreaParametersService,
          useValue: mockAreaParametersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RealEmailService>(RealEmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should call getEmailParameters and handle email sending', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        id: 100,
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation = jest
        .fn()
        .mockResolvedValue([
          { variable: { name: 'to' }, value: 'recipient@example.com' },
          { variable: { name: 'subject' }, value: 'Test Subject' },
          { variable: { name: 'body' }, value: 'Test body' },
        ]);

      mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });
      mockAreaExecutionsService.completeExecution.mockResolvedValue({});

      await service.sendEmail(100, 1);

      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalledWith(
        100,
        expect.any(Object),
      );
    });

    it('should handle errors internally without throwing', async () => {
      mockAreaParametersService.findByAreaWithInterpolation = jest
        .fn()
        .mockRejectedValue(new Error('Parameter not found'));

      mockAreaExecutionsService.failExecution.mockResolvedValue({});

      // Should not throw, errors are caught internally
      await service.sendEmail(100, 1);

      // Test passes if no error was thrown
      expect(true).toBe(true);
    });
  });
});
