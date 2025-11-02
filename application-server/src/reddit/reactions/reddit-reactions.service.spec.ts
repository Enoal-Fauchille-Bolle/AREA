/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { RedditReactionsService } from './reddit-reactions.service';
import { AreaExecutionsService } from '../../area-executions/area-executions.service';
import { AreaParametersService } from '../../area-parameters/area-parameters.service';

describe('RedditReactionsService', () => {
  let service: RedditReactionsService;
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
        RedditReactionsService,
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

    service = module.get<RedditReactionsService>(RedditReactionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should create Reddit post successfully', async () => {
      const executionId = 1;
      const areaId = 10;

      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'subreddit' }, value: 'test' },
        { variable: { name: 'title' }, value: 'Test Post' },
        { variable: { name: 'text' }, value: 'This is a test post' },
      ]);

      await service.createPost(executionId, areaId);

      expect(
        mockAreaParametersService.findByAreaWithInterpolation,
      ).toHaveBeenCalledWith(areaId, expect.any(Object));
      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalledWith(
        executionId,
        expect.objectContaining({
          executionResult: expect.objectContaining({
            subreddit: 'test',
            title: 'Test Post',
            post_url: expect.stringContaining('reddit.com'),
          }),
        }),
      );
    });

    it('should use empty text when not provided', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'subreddit' }, value: 'programming' },
        { variable: { name: 'title' }, value: 'New Post' },
      ]);

      await service.createPost(1, 10);

      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          executionResult: expect.objectContaining({
            subreddit: 'programming',
            title: 'New Post',
          }),
        }),
      );
    });

    it('should fail when subreddit is missing', async () => {
      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'title' }, value: 'Test' },
      ]);

      await service.createPost(1, 10);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.any(String),
      );
    });

    it('should fail when title is missing', async () => {
      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'subreddit' }, value: 'test' },
      ]);

      await service.createPost(1, 10);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.any(String),
      );
    });

    it('should interpolate variables from execution context', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: { eventName: 'TestEvent' },
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'subreddit' }, value: 'test' },
        { variable: { name: 'title' }, value: 'Event: TestEvent' },
        { variable: { name: 'text' }, value: 'Triggered by TestEvent' },
      ]);

      await service.createPost(1, 10);

      expect(mockAreaExecutionsService.findOne).toHaveBeenCalledWith(1);
      expect(
        mockAreaParametersService.findByAreaWithInterpolation,
      ).toHaveBeenCalledWith(10, { eventName: 'TestEvent' });
    });

    it('should generate valid post IDs with t3 prefix', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'subreddit' }, value: 'test' },
        { variable: { name: 'title' }, value: 'Post 1' },
      ]);

      await service.createPost(1, 10);

      const firstCall =
        mockAreaExecutionsService.completeExecution.mock.calls[0];
      const firstPostId = firstCall[1].executionResult.post_id;

      expect(firstPostId).toMatch(/^t3_/);
      expect(firstPostId.length).toBeGreaterThan(3);
    });
  });

  describe('processReaction', () => {
    it('should call createPost', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'subreddit' }, value: 'test' },
        { variable: { name: 'title' }, value: 'Test' },
      ]);

      await service.processReaction(1, 10);

      expect(
        mockAreaParametersService.findByAreaWithInterpolation,
      ).toHaveBeenCalled();
    });
  });
});
