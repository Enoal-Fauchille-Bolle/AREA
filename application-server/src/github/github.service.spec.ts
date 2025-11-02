/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GithubService } from './github.service';
import { Area } from '../areas/entities/area.entity';
import { HookStatesService } from '../hook-states/hook-states.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { ReactionProcessorService } from '../common/reaction-processor.service';
import type {
  GitHubPushEvent,
  GitHubPullRequestEvent,
  GitHubIssueEvent,
} from './github.service';

describe('GithubService', () => {
  let service: GithubService;
  let mockAreaRepository: any;
  let mockHookStatesService: any;
  let mockAreaExecutionsService: any;
  let mockReactionProcessorService: any;

  beforeEach(async () => {
    mockAreaRepository = {
      createQueryBuilder: jest.fn(),
    };

    mockHookStatesService = {
      getState: jest.fn(),
      setState: jest.fn(),
    };

    mockAreaExecutionsService = {
      create: jest.fn(),
      startExecution: jest.fn(),
    };

    mockReactionProcessorService = {
      processReaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        {
          provide: getRepositoryToken(Area),
          useValue: mockAreaRepository,
        },
        {
          provide: HookStatesService,
          useValue: mockHookStatesService,
        },
        {
          provide: AreaExecutionsService,
          useValue: mockAreaExecutionsService,
        },
        {
          provide: ReactionProcessorService,
          useValue: mockReactionProcessorService,
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handlePushEvent', () => {
    const mockPushEvent: GitHubPushEvent = {
      ref: 'refs/heads/main',
      repository: {
        id: 123,
        name: 'test-repo',
        full_name: 'user/test-repo',
        owner: { login: 'user' },
      },
      pusher: { name: 'testuser', email: 'test@example.com' },
      commits: [
        {
          id: 'abc123',
          message: 'Test commit',
          timestamp: '2024-01-01T00:00:00Z',
          url: 'https://github.com/user/test-repo/commit/abc123',
          author: { name: 'Test User', email: 'test@example.com' },
          committer: { name: 'Test User', email: 'test@example.com' },
        },
      ],
      head_commit: {
        id: 'abc123',
        message: 'Test commit',
        timestamp: '2024-01-01T00:00:00Z',
        url: 'https://github.com/user/test-repo/commit/abc123',
        author: { name: 'Test User', email: 'test@example.com' },
        committer: { name: 'Test User', email: 'test@example.com' },
      },
    };

    it('should handle push event successfully', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Test Area', component_reaction_id: 2 },
          ]),
      };

      mockAreaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockHookStatesService.getState.mockResolvedValue('user/test-repo');
      mockAreaExecutionsService.create.mockResolvedValue({ id: 100 });
      mockAreaExecutionsService.startExecution.mockResolvedValue({});
      mockReactionProcessorService.processReaction.mockResolvedValue(undefined);

      await service.handlePushEvent(mockPushEvent);

      expect(mockAreaRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockAreaExecutionsService.create).toHaveBeenCalled();
      expect(mockReactionProcessorService.processReaction).toHaveBeenCalled();
    });

    it('should skip areas with non-matching repository', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Area' }]),
      };

      mockAreaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockHookStatesService.getState.mockResolvedValue('other/repo');

      await service.handlePushEvent(mockPushEvent);

      expect(mockAreaExecutionsService.create).not.toHaveBeenCalled();
    });

    it('should match all repositories when no filter configured', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Test Area', component_reaction_id: 2 },
          ]),
      };

      mockAreaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockHookStatesService.getState.mockResolvedValue(null);
      mockAreaExecutionsService.create.mockResolvedValue({ id: 100 });
      mockAreaExecutionsService.startExecution.mockResolvedValue({});

      await service.handlePushEvent(mockPushEvent);

      expect(mockAreaExecutionsService.create).toHaveBeenCalled();
    });
  });

  describe('handlePullRequestEvent', () => {
    const mockPREvent: GitHubPullRequestEvent = {
      action: 'opened',
      number: 42,
      pull_request: {
        id: 1,
        number: 42,
        title: 'Test PR',
        body: 'PR description',
        state: 'open',
        html_url: 'https://github.com/user/repo/pull/42',
        user: { login: 'testuser' },
        head: { ref: 'feature-branch' },
        base: { ref: 'main' },
      },
      repository: {
        id: 123,
        name: 'test-repo',
        full_name: 'user/test-repo',
      },
    };

    it('should handle opened pull request event', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Test Area', component_reaction_id: 2 },
          ]),
      };

      mockAreaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockHookStatesService.getState.mockResolvedValue('user/test-repo');
      mockAreaExecutionsService.create.mockResolvedValue({ id: 100 });
      mockAreaExecutionsService.startExecution.mockResolvedValue({});

      await service.handlePullRequestEvent(mockPREvent);

      expect(mockAreaExecutionsService.create).toHaveBeenCalled();
    });

    it('should ignore non-opened PR actions', async () => {
      const closedPREvent = { ...mockPREvent, action: 'closed' };

      await service.handlePullRequestEvent(closedPREvent);

      expect(mockAreaRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('handleIssueEvent', () => {
    const mockIssueEvent: GitHubIssueEvent = {
      action: 'opened',
      issue: {
        id: 1,
        number: 42,
        title: 'Test Issue',
        body: 'Issue description',
        state: 'open',
        html_url: 'https://github.com/user/repo/issues/42',
        user: { login: 'testuser' },
        labels: [{ name: 'bug' }, { name: 'urgent' }],
        milestone: null,
      },
      repository: {
        id: 123,
        name: 'test-repo',
        full_name: 'user/test-repo',
      },
    };

    it('should handle opened issue event', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Test Area', component_reaction_id: 2 },
          ]),
      };

      mockAreaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockHookStatesService.getState.mockResolvedValue('user/test-repo');
      mockAreaExecutionsService.create.mockResolvedValue({ id: 100 });
      mockAreaExecutionsService.startExecution.mockResolvedValue({});

      await service.handleIssueEvent(mockIssueEvent);

      expect(mockAreaExecutionsService.create).toHaveBeenCalled();
    });

    it('should ignore non-opened issue actions', async () => {
      const closedIssueEvent = { ...mockIssueEvent, action: 'closed' };

      await service.handleIssueEvent(closedIssueEvent);

      expect(mockAreaRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should handle issues with milestone', async () => {
      const issueWithMilestone = {
        ...mockIssueEvent,
        issue: {
          ...mockIssueEvent.issue,
          milestone: {
            id: 1,
            title: 'v1.0',
            description: 'First release',
            html_url: 'https://github.com/user/repo/milestone/1',
          },
        },
      };

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Test Area', component_reaction_id: 2 },
          ]),
      };

      mockAreaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockHookStatesService.getState.mockResolvedValue('user/test-repo');
      mockAreaExecutionsService.create.mockResolvedValue({ id: 100 });
      mockAreaExecutionsService.startExecution.mockResolvedValue({});

      await service.handleIssueEvent(issueWithMilestone);

      expect(mockAreaExecutionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          triggerData: expect.objectContaining({
            issue_milestone: 'v1.0',
          }),
        }),
      );
    });
  });

  describe('Type Guards', () => {
    it('should validate push event', () => {
      const validPushEvent = {
        ref: 'refs/heads/main',
        repository: { full_name: 'user/repo' },
        pusher: { name: 'user' },
        commits: [],
      };

      expect(GithubService.isValidPushEvent(validPushEvent)).toBe(true);
      expect(GithubService.isValidPushEvent({})).toBe(false);
      expect(GithubService.isValidPushEvent(null)).toBe(false);
    });

    it('should validate pull request event', () => {
      const validPREvent = {
        action: 'opened',
        number: 1,
        pull_request: { title: 'Test', html_url: 'url' },
        repository: { full_name: 'user/repo' },
      };

      expect(GithubService.isValidPullRequestEvent(validPREvent)).toBe(true);
      expect(GithubService.isValidPullRequestEvent({})).toBe(false);
      expect(GithubService.isValidPullRequestEvent(null)).toBe(false);
    });

    it('should validate issue event', () => {
      const validIssueEvent = {
        action: 'opened',
        issue: { title: 'Test', html_url: 'url', number: 1 },
        repository: { full_name: 'user/repo' },
      };

      expect(GithubService.isValidIssueEvent(validIssueEvent)).toBe(true);
      expect(GithubService.isValidIssueEvent({})).toBe(false);
      expect(GithubService.isValidIssueEvent(null)).toBe(false);
    });
  });
});
