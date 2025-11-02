import { Test, TestingModule } from '@nestjs/testing';
import { FakeEmailService } from './email.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

describe('FakeEmailService', () => {
  let service: FakeEmailService;
  let mockAreaExecutionsService: any;
  let mockAreaParametersService: any;

  beforeEach(async () => {
    mockAreaExecutionsService = {
      completeExecution: jest.fn(),
      failExecution: jest.fn(),
      findOne: jest.fn(),
    };

    mockAreaParametersService = {
      findByAreaWithInterpolation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FakeEmailService,
        {
          provide: AreaExecutionsService,
          useValue: mockAreaExecutionsService,
        },
        {
          provide: AreaParametersService,
          useValue: mockAreaParametersService,
        },
      ],
    }).compile();

    service = module.get<FakeEmailService>(FakeEmailService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const executionId = 1;
      const areaId = 10;

      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'to' }, value: 'test@example.com' },
        { variable: { name: 'subject' }, value: 'Test Subject' },
        { variable: { name: 'body' }, value: 'Test Body' },
      ]);

      await service.sendEmail(executionId, areaId);

      expect(
        mockAreaParametersService.findByAreaWithInterpolation,
      ).toHaveBeenCalledWith(areaId, expect.any(Object));
      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalledWith(
        executionId,
        expect.objectContaining({
          executionResult: expect.objectContaining({
            email_recipient: 'test@example.com',
            email_subject: 'Test Subject',
          }),
        }),
      );
    });

    it('should use default subject when not provided', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'to' }, value: 'user@example.com' },
        { variable: { name: 'body' }, value: 'Some body text' },
      ]);

      await service.sendEmail(1, 10);

      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          executionResult: expect.objectContaining({
            email_subject: 'AREA Notification',
          }),
        }),
      );
    });

    it('should fail when recipient is missing', async () => {
      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'subject' }, value: 'Test' },
      ]);

      await service.sendEmail(1, 10);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.any(String),
      );
    });

    it('should interpolate variables from execution context', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: { userName: 'John' },
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'to' }, value: 'john@example.com' },
        { variable: { name: 'subject' }, value: 'Hello John' },
        { variable: { name: 'body' }, value: 'Welcome John' },
      ]);

      await service.sendEmail(1, 10);

      expect(mockAreaExecutionsService.findOne).toHaveBeenCalledWith(1);
      expect(
        mockAreaParametersService.findByAreaWithInterpolation,
      ).toHaveBeenCalledWith(10, { userName: 'John' });
    });
  });

  describe('processReaction', () => {
    it('should call sendEmail', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'to' }, value: 'test@example.com' },
        { variable: { name: 'subject' }, value: 'Test' },
        { variable: { name: 'body' }, value: 'Body' },
      ]);

      await service.processReaction(1, 10);

      expect(
        mockAreaParametersService.findByAreaWithInterpolation,
      ).toHaveBeenCalled();
    });
  });
});
