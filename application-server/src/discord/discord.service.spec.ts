/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DiscordService } from './discord.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { AreasService } from '../areas/areas.service';
import { ReactionProcessorService } from '../common/reaction-processor.service';

describe('DiscordService', () => {
  let service: DiscordService;
  let mockAreaExecutionsService: any;
  let mockAreaParametersService: any;
  let mockAreasService: any;
  let mockReactionProcessorService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockAreaExecutionsService = {
      findOne: jest.fn(),
      create: jest.fn(),
      completeExecution: jest.fn(),
      failExecution: jest.fn(),
    };

    mockAreaParametersService = {
      findByArea: jest.fn(),
      findByAreaWithInterpolation: jest.fn(),
    };

    mockAreasService = {
      findByActionComponent: jest.fn(),
    };

    mockReactionProcessorService = {
      processReaction: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue({
        oauth2: {
          discord: {
            botToken: undefined, // Not configured by default
          },
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordService,
        {
          provide: AreaExecutionsService,
          useValue: mockAreaExecutionsService,
        },
        {
          provide: AreaParametersService,
          useValue: mockAreaParametersService,
        },
        {
          provide: AreasService,
          useValue: mockAreasService,
        },
        {
          provide: ReactionProcessorService,
          useValue: mockReactionProcessorService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DiscordService>(DiscordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should fail when bot token is not configured', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        id: 1,
        triggerData: {},
      });
      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'channel_id' }, value: '123456789' },
        { variable: { name: 'content' }, value: 'Test message' },
      ]);

      await service.sendMessage(1, 1);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.stringContaining('Discord Bot Token not configured'),
      );
    });

    it('should handle missing parameters gracefully', async () => {
      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue(
        [],
      );

      await service.sendMessage(1, 1);

      // Bot token check happens first
      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.stringContaining('Discord Bot Token not configured'),
      );
    });
  });

  describe('reactToMessage', () => {
    it('should fail when bot token is not configured', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        id: 1,
        triggerData: {},
      });
      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'channel_id' }, value: '123456789' },
        { variable: { name: 'message_id' }, value: '987654321' },
        { variable: { name: 'emoji' }, value: '👍' },
      ]);

      await service.reactToMessage(1, 1);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.stringContaining('Discord Bot Token not configured'),
      );
    });

    it('should handle missing parameters gracefully', async () => {
      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue(
        [],
      );

      await service.reactToMessage(1, 1);

      // Bot token check happens first
      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.stringContaining('Discord Bot Token not configured'),
      );
    });
  });

  describe('processReaction', () => {
    it('should delegate to sendMessage', async () => {
      const sendMessageSpy = jest
        .spyOn(service, 'sendMessage')
        .mockResolvedValue();

      await service.processReaction(1, 1);

      expect(sendMessageSpy).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('sendMessageReaction', () => {
    it('should delegate to sendMessage', async () => {
      const sendMessageSpy = jest
        .spyOn(service, 'sendMessage')
        .mockResolvedValue();

      await service.sendMessageReaction(1, 1);

      expect(sendMessageSpy).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('reactToMessageReaction', () => {
    it('should delegate to reactToMessage', async () => {
      const reactToMessageSpy = jest
        .spyOn(service, 'reactToMessage')
        .mockResolvedValue();

      await service.reactToMessageReaction(1, 1);

      expect(reactToMessageSpy).toHaveBeenCalledWith(1, 1);
    });
  });
});
