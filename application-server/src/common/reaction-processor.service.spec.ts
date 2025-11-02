/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ReactionProcessorService } from './reaction-processor.service';
import { FakeEmailService } from '../email/email.service';
import { RealEmailService } from '../email/real-email.service';
import { DiscordService } from '../discord/discord.service';
import { ComponentsService } from '../components/components.service';
import { GmailReactionsService } from '../gmail/reactions/gmail-reactions.service';
import { TwitchReactionsService } from '../twitch/reactions/twitch-reactions.service';
import { RedditReactionsService } from '../reddit/reactions/reddit-reactions.service';
import { SpotifyService } from '../spotify/spotify.service';
import { TrelloReactionsService } from '../trello/reactions/trello-reactions.service';

describe('ReactionProcessorService', () => {
  let service: ReactionProcessorService;
  let mockFakeEmailService: any;
  let mockRealEmailService: any;
  let mockDiscordService: any;
  let mockComponentsService: any;
  let mockGmailReactionsService: any;
  let mockTwitchReactionsService: any;
  let mockRedditReactionsService: any;
  let mockSpotifyService: any;
  let mockTrelloReactionsService: any;

  beforeEach(async () => {
    mockFakeEmailService = {
      processReaction: jest.fn(),
    };

    mockRealEmailService = {
      processReaction: jest.fn(),
    };

    mockDiscordService = {
      sendMessageReaction: jest.fn(),
      reactToMessageReaction: jest.fn(),
    };

    mockComponentsService = {
      findOne: jest.fn(),
    };

    mockGmailReactionsService = {
      processReaction: jest.fn(),
    };

    mockTwitchReactionsService = {
      processReaction: jest.fn(),
    };

    mockRedditReactionsService = {
      processReaction: jest.fn(),
    };

    mockSpotifyService = {
      addToPlaylistReaction: jest.fn(),
      addToQueueReaction: jest.fn(),
    };

    mockTrelloReactionsService = {
      createCard: jest.fn(),
      moveCard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionProcessorService,
        {
          provide: FakeEmailService,
          useValue: mockFakeEmailService,
        },
        {
          provide: RealEmailService,
          useValue: mockRealEmailService,
        },
        {
          provide: DiscordService,
          useValue: mockDiscordService,
        },
        {
          provide: ComponentsService,
          useValue: mockComponentsService,
        },
        {
          provide: GmailReactionsService,
          useValue: mockGmailReactionsService,
        },
        {
          provide: TwitchReactionsService,
          useValue: mockTwitchReactionsService,
        },
        {
          provide: RedditReactionsService,
          useValue: mockRedditReactionsService,
        },
        {
          provide: SpotifyService,
          useValue: mockSpotifyService,
        },
        {
          provide: TrelloReactionsService,
          useValue: mockTrelloReactionsService,
        },
      ],
    }).compile();

    service = module.get<ReactionProcessorService>(ReactionProcessorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processReaction', () => {
    it('should process fake_email reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({ name: 'fake_email' });

      await service.processReaction(1, 100, 10);

      expect(mockFakeEmailService.processReaction).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process send_email reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({ name: 'send_email' });

      await service.processReaction(2, 100, 10);

      expect(mockRealEmailService.processReaction).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process send_message reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({ name: 'send_message' });

      await service.processReaction(3, 100, 10);

      expect(mockDiscordService.sendMessageReaction).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process react_to_message reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({
        name: 'react_to_message',
      });

      await service.processReaction(4, 100, 10);

      expect(mockDiscordService.reactToMessageReaction).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process send_gmail reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({ name: 'send_gmail' });

      await service.processReaction(5, 100, 10);

      expect(mockGmailReactionsService.processReaction).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process send_chat_message reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({
        name: 'send_chat_message',
      });

      await service.processReaction(6, 100, 10);

      expect(mockTwitchReactionsService.processReaction).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process create_reddit_post reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({
        name: 'create_reddit_post',
      });

      await service.processReaction(7, 100, 10);

      expect(mockRedditReactionsService.processReaction).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process add_to_playlist reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({
        name: 'add_to_playlist',
      });

      await service.processReaction(8, 100, 10);

      expect(mockSpotifyService.addToPlaylistReaction).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process add_to_queue reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({
        name: 'add_to_queue',
      });

      await service.processReaction(9, 100, 10);

      expect(mockSpotifyService.addToQueueReaction).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process create_card reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({ name: 'create_card' });

      await service.processReaction(10, 100, 10);

      expect(mockTrelloReactionsService.createCard).toHaveBeenCalledWith(
        100,
        10,
      );
    });

    it('should process move_card reaction', async () => {
      mockComponentsService.findOne.mockResolvedValue({ name: 'move_card' });

      await service.processReaction(11, 100, 10);

      expect(mockTrelloReactionsService.moveCard).toHaveBeenCalledWith(100, 10);
    });

    it('should throw error for unknown reaction types', async () => {
      mockComponentsService.findOne.mockResolvedValue({
        name: 'unknown_reaction',
      });

      await expect(service.processReaction(999, 100, 10)).rejects.toThrow(
        'Unknown reaction component: unknown_reaction',
      );
    });

    it('should throw error when component not found', async () => {
      mockComponentsService.findOne.mockResolvedValue(null);

      await expect(service.processReaction(999, 100, 10)).rejects.toThrow(
        'Reaction component 999 not found',
      );
    });

    it('should propagate errors from reaction services', async () => {
      mockComponentsService.findOne.mockResolvedValue({ name: 'fake_email' });
      mockFakeEmailService.processReaction.mockRejectedValue(
        new Error('Email service error'),
      );

      await expect(service.processReaction(1, 100, 10)).rejects.toThrow(
        'Email service error',
      );
    });
  });
});
