/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';

describe('GithubController', () => {
  let controller: GithubController;
  let mockGithubService: {
    handlePushEvent: jest.Mock;
    handlePullRequestEvent: jest.Mock;
    handleIssueEvent: jest.Mock;
  };

  const mockPushPayload = {
    ref: 'refs/heads/main',
    repository: {
      name: 'test-repo',
      full_name: 'user/test-repo',
    },
    pusher: {
      name: 'testuser',
    },
  };

  const mockPullRequestPayload = {
    action: 'opened',
    pull_request: {
      id: 1,
      title: 'Test PR',
      state: 'open',
    },
    repository: {
      name: 'test-repo',
    },
  };

  const mockIssuePayload = {
    action: 'opened',
    issue: {
      id: 1,
      title: 'Test Issue',
      state: 'open',
    },
    repository: {
      name: 'test-repo',
    },
  };

  beforeEach(async () => {
    // Mock the static methods
    jest.spyOn(GithubService, 'isValidPushEvent').mockReturnValue(true);
    jest.spyOn(GithubService, 'isValidPullRequestEvent').mockReturnValue(true);
    jest.spyOn(GithubService, 'isValidIssueEvent').mockReturnValue(true);

    mockGithubService = {
      handlePushEvent: jest.fn().mockResolvedValue(undefined),
      handlePullRequestEvent: jest.fn().mockResolvedValue(undefined),
      handleIssueEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [
        {
          provide: GithubService,
          useValue: mockGithubService,
        },
      ],
    }).compile();

    controller = module.get<GithubController>(GithubController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleWebhook', () => {
    it('should throw BadRequestException when event header is missing', async () => {
      await expect(
        controller.handleWebhook('' as any, 'delivery-123', {}),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.handleWebhook('' as any, 'delivery-123', {}),
      ).rejects.toThrow('Missing X-GitHub-Event header');
    });

    it('should handle push event', async () => {
      const result = await controller.handleWebhook(
        'push',
        'delivery-123',
        mockPushPayload,
      );

      expect(result.message).toBe('Webhook processed successfully');
      expect(mockGithubService.handlePushEvent).toHaveBeenCalledWith(
        mockPushPayload,
      );
    });

    it('should throw BadRequestException for invalid push payload', async () => {
      jest.spyOn(GithubService, 'isValidPushEvent').mockReturnValue(false);

      await expect(
        controller.handleWebhook('push', 'delivery-123', {}),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.handleWebhook('push', 'delivery-123', {}),
      ).rejects.toThrow('Invalid payload structure for push event');
    });

    it('should handle pull_request event', async () => {
      const result = await controller.handleWebhook(
        'pull_request',
        'delivery-456',
        mockPullRequestPayload,
      );

      expect(result.message).toBe('Webhook processed successfully');
      expect(mockGithubService.handlePullRequestEvent).toHaveBeenCalledWith(
        mockPullRequestPayload,
      );
    });

    it('should throw BadRequestException for invalid pull_request payload', async () => {
      jest
        .spyOn(GithubService, 'isValidPullRequestEvent')
        .mockReturnValue(false);

      await expect(
        controller.handleWebhook('pull_request', 'delivery-456', {}),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.handleWebhook('pull_request', 'delivery-456', {}),
      ).rejects.toThrow('Invalid payload structure for pull_request event');
    });

    it('should handle issues event', async () => {
      const result = await controller.handleWebhook(
        'issues',
        'delivery-789',
        mockIssuePayload,
      );

      expect(result.message).toBe('Webhook processed successfully');
      expect(mockGithubService.handleIssueEvent).toHaveBeenCalledWith(
        mockIssuePayload,
      );
    });

    it('should throw BadRequestException for invalid issues payload', async () => {
      jest.spyOn(GithubService, 'isValidIssueEvent').mockReturnValue(false);

      await expect(
        controller.handleWebhook('issues', 'delivery-789', {}),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.handleWebhook('issues', 'delivery-789', {}),
      ).rejects.toThrow('Invalid payload structure for issues event');
    });

    it('should handle ping event', async () => {
      const result = await controller.handleWebhook('ping', 'delivery-111', {});

      expect(result.message).toBe('pong');
      expect(mockGithubService.handlePushEvent).not.toHaveBeenCalled();
    });

    it('should handle unsupported events', async () => {
      const result = await controller.handleWebhook('star', 'delivery-222', {});

      expect(result.message).toBe('Event star not handled');
      expect(mockGithubService.handlePushEvent).not.toHaveBeenCalled();
    });

    it('should rethrow errors from service', async () => {
      const error = new Error('Service error');
      mockGithubService.handlePushEvent.mockRejectedValue(error);

      await expect(
        controller.handleWebhook('push', 'delivery-333', mockPushPayload),
      ).rejects.toThrow('Service error');
    });
  });
});
