import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../app/pages/Profile';

// Mock des hooks OAuth
vi.mock('../hooks/useDiscordAuth', () => ({
  useDiscordAuth: () => ({
    connectToDiscord: vi.fn(),
    disconnectFromDiscord: vi.fn(),
    isDiscordConnecting: false,
    isDiscordDisconnecting: false,
    discordUser: null,
  }),
}));

vi.mock('../hooks/useGitHubAuth', () => ({
  useGitHubAuth: () => ({
    connectToGitHub: vi.fn(),
    disconnectFromGitHub: vi.fn(),
    isGitHubConnecting: false,
    isGitHubDisconnecting: false,
    githubUser: null,
  }),
}));

vi.mock('../hooks/useTwitchAuth', () => ({
  useTwitchAuth: () => ({
    connectToTwitch: vi.fn(),
    disconnectFromTwitch: vi.fn(),
    isTwitchConnecting: false,
    isTwitchDisconnecting: false,
    twitchUser: null,
  }),
}));

vi.mock('../hooks/useGmailAuth', () => ({
  useGmailAuth: () => ({
    connectToGmail: vi.fn(),
    disconnectFromGmail: vi.fn(),
    isGmailConnecting: false,
    isGmailDisconnecting: false,
    gmailUser: null,
  }),
}));

vi.mock('../hooks/useRedditAuth', () => ({
  useRedditAuth: () => ({
    connectToReddit: vi.fn(),
    disconnectFromReddit: vi.fn(),
    isRedditConnecting: false,
    isRedditDisconnecting: false,
    redditUser: null,
  }),
}));

vi.mock('../hooks/useSpotifyAuth', () => ({
  useSpotifyAuth: () => ({
    connectToSpotify: vi.fn(),
    disconnectFromSpotify: vi.fn(),
    isSpotifyConnecting: false,
    isSpotifyDisconnecting: false,
    spotifyUser: null,
  }),
}));

vi.mock('../hooks/useTrelloAuth', () => ({
  useTrelloAuth: () => ({
    connectToTrello: vi.fn(),
    disconnectTrello: vi.fn(),
    isConnecting: false,
    isConnected: false,
    trelloUser: null,
  }),
}));

// Mock de l'API services
vi.mock('../services/api', () => ({
  servicesApi: {
    getServices: vi.fn().mockResolvedValue([]),
    getUserServices: vi.fn().mockResolvedValue([]),
    disconnectService: vi.fn().mockResolvedValue({}),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile page title', async () => {
    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByText(/OAuth2 Services/i)).toBeInTheDocument();
    });
  });

  it('displays all 7 OAuth services', async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Discord/i)).toBeInTheDocument();
      expect(screen.getByText(/GitHub/i)).toBeInTheDocument();
      expect(screen.getByText(/Twitch/i)).toBeInTheDocument();
      expect(screen.getByText(/Gmail/i)).toBeInTheDocument();
      expect(screen.getByText(/Reddit/i)).toBeInTheDocument();
      expect(screen.getByText(/Spotify/i)).toBeInTheDocument();
      expect(screen.getByText(/Trello/i)).toBeInTheDocument();
    });
  });

  it('renders Back to Areas button', async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const backButton = screen.getByText(/Back to Areas/i);
      expect(backButton).toBeInTheDocument();
    });
  });

  it('navigates back when clicking Back to Areas', async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const backButton = screen.getByText(/Back to Areas/i);
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  it('displays connection status badge', async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const statusText = screen.getByText(/0 of 7 connected/i);
      expect(statusText).toBeInTheDocument();
    });
  });

  it('renders service cards in grid layout', async () => {
    const { container } = render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  it('displays Connect buttons for disconnected services', async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const connectButtons = screen.getAllByText(/^Connect$/i);
      expect(connectButtons.length).toBeGreaterThan(0);
    });
  });

  it('has responsive design classes', async () => {
    const { container } = render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
    });
  });
});
