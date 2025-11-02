import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ServiceCallback from '../app/pages/ServiceCallback';
import { trelloOAuth } from '../lib/trelloOAuth';

// Mock the API
vi.mock('../services/api', () => ({
  authApi: {
    loginWithOAuth2: vi.fn(),
    registerWithOAuth2: vi.fn(),
  },
  tokenService: {
    setToken: vi.fn(),
    getToken: vi.fn(() => 'mock-token'),
  },
}));

// Mock the OAuth libraries
vi.mock('../lib/googleOAuth', () => ({
  googleOAuth: {
    extractIntentFromUrl: vi.fn(() => 'login'),
    redirectUri: 'http://localhost:8081/service/callback',
  },
}));

vi.mock('../lib/githubOAuth', () => ({
  githubOAuth: {
    extractIntentFromUrl: vi.fn(() => 'login'),
    redirectUri: 'http://localhost:8081/service/callback',
  },
}));

vi.mock('../lib/discordOAuth', () => ({
  discordOAuth: {
    extractIntentFromUrl: vi.fn(() => 'login'),
    redirectUri: 'http://localhost:8081/service/callback',
  },
}));

vi.mock('../lib/twitchOAuth', () => ({
  twitchOAuth: {
    extractIntentFromUrl: vi.fn(() => 'login'),
    redirectUri: 'http://localhost:8081/service/callback',
  },
}));

vi.mock('../lib/gmailOAuth', () => ({
  gmailOAuth: {
    redirectUri: 'http://localhost:8081/service/callback',
  },
}));

vi.mock('../lib/redditOAuth', () => ({
  redditOAuth: {
    redirectUri: 'http://localhost:8080/reddit/callback',
  },
}));

vi.mock('../lib/trelloOAuth', () => ({
  trelloOAuth: {
    apiKey: 'mock-trello-api-key',
    extractTokenFromUrl: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/service/callback',
      search: '',
      hash: '',
      state: null,
    }),
  };
});

describe('ServiceCallback - Reddit and Trello Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reddit OAuth Callback', () => {
    it('should handle Reddit OAuth callback in popup mode', async () => {
      // Mock window.opener
      const mockOpener = {
        postMessage: vi.fn(),
      };
      Object.defineProperty(window, 'opener', {
        writable: true,
        value: mockOpener,
      });

      // Mock window.close
      const mockClose = vi.fn();
      window.close = mockClose;

      // Mock URL with Reddit code
      Object.defineProperty(window, 'location', {
        writable: true,
        value: new URL(
          'http://localhost:8081/service/callback?code=reddit-code-123&state=reddit:service_link',
        ),
      });

      render(
        <BrowserRouter>
          <ServiceCallback />
        </BrowserRouter>,
      );

      await waitFor(() => {
        expect(mockOpener.postMessage).toHaveBeenCalledWith(
          {
            type: 'REDDIT_OAUTH_SUCCESS',
            code: 'reddit-code-123',
          },
          '*',
        );
      });

      // Cleanup
      Object.defineProperty(window, 'opener', {
        writable: true,
        value: null,
      });
    });

    it('should handle Reddit OAuth error in popup mode', async () => {
      const mockOpener = {
        postMessage: vi.fn(),
      };
      Object.defineProperty(window, 'opener', {
        writable: true,
        value: mockOpener,
      });

      const mockClose = vi.fn();
      window.close = mockClose;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: new URL(
          'http://localhost:8081/service/callback?error=access_denied&state=reddit:service_link',
        ),
      });

      render(
        <BrowserRouter>
          <ServiceCallback />
        </BrowserRouter>,
      );

      await waitFor(() => {
        expect(mockOpener.postMessage).toHaveBeenCalledWith(
          {
            type: 'REDDIT_OAUTH_ERROR',
            error: 'access_denied',
          },
          '*',
        );
      });

      Object.defineProperty(window, 'opener', {
        writable: true,
        value: null,
      });
    });
  });

  describe('Trello OAuth Callback', () => {
    it('should handle Trello OAuth callback with token in hash', async () => {
      // Mock the extractTokenFromUrl to return the token
      vi.mocked(trelloOAuth.extractTokenFromUrl).mockReturnValue(
        'trello-token-abc123',
      );

      const mockOpener = {
        postMessage: vi.fn(),
      };
      Object.defineProperty(window, 'opener', {
        writable: true,
        value: mockOpener,
      });

      const mockClose = vi.fn();
      window.close = mockClose;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: new URL(
          'http://localhost:8081/service/callback?state=trello:service_link#token=trello-token-abc123',
        ),
      });

      render(
        <BrowserRouter>
          <ServiceCallback />
        </BrowserRouter>,
      );

      await waitFor(() => {
        expect(mockOpener.postMessage).toHaveBeenCalledWith(
          {
            type: 'TRELLO_OAUTH_SUCCESS',
            token: 'trello-token-abc123',
          },
          '*',
        );
      });

      Object.defineProperty(window, 'opener', {
        writable: true,
        value: null,
      });
    });

    it('should handle Trello OAuth error', async () => {
      // Mock the extractTokenFromUrl to return null (no token)
      vi.mocked(trelloOAuth.extractTokenFromUrl).mockReturnValue(null);

      const mockOpener = {
        postMessage: vi.fn(),
      };
      Object.defineProperty(window, 'opener', {
        writable: true,
        value: mockOpener,
      });

      const mockClose = vi.fn();
      window.close = mockClose;

      Object.defineProperty(window, 'location', {
        writable: true,
        value: new URL(
          'http://localhost:8081/service/callback?error=access_denied&state=trello:service_link',
        ),
      });

      render(
        <BrowserRouter>
          <ServiceCallback />
        </BrowserRouter>,
      );

      await waitFor(() => {
        expect(mockOpener.postMessage).toHaveBeenCalledWith(
          {
            type: 'TRELLO_OAUTH_ERROR',
            error: 'access_denied',
          },
          '*',
        );
      });

      Object.defineProperty(window, 'opener', {
        writable: true,
        value: null,
      });
    });

    it('should handle missing token in Trello callback', async () => {
      // Mock the extractTokenFromUrl to return null
      vi.mocked(trelloOAuth.extractTokenFromUrl).mockReturnValue(null);

      const mockOpener = {
        postMessage: vi.fn(),
      };
      Object.defineProperty(window, 'opener', {
        writable: true,
        value: mockOpener,
      });

      Object.defineProperty(window, 'location', {
        writable: true,
        value: new URL(
          'http://localhost:8081/service/callback?state=trello:service_link',
        ),
      });

      render(
        <BrowserRouter>
          <ServiceCallback />
        </BrowserRouter>,
      );

      await waitFor(() => {
        expect(mockOpener.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'TRELLO_OAUTH_ERROR',
          }),
          '*',
        );
      });

      Object.defineProperty(window, 'opener', {
        writable: true,
        value: null,
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state initially', () => {
      Object.defineProperty(window, 'opener', {
        writable: true,
        value: null,
      });

      Object.defineProperty(window, 'location', {
        writable: true,
        value: new URL(
          'http://localhost:8081/service/callback?code=test&state=reddit:service_link',
        ),
      });

      render(
        <BrowserRouter>
          <ServiceCallback />
        </BrowserRouter>,
      );

      expect(screen.getByText(/Authenticating/i)).toBeInTheDocument();
    });
  });
});
