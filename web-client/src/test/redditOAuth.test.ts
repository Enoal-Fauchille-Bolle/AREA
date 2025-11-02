import { describe, it, expect, beforeEach, vi } from 'vitest';
import { redditOAuth } from '../lib/redditOAuth';

describe('Reddit OAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should generate correct Reddit OAuth URL', () => {
      const authUrl = redditOAuth.getAuthUrl();

      expect(authUrl).toContain('https://www.reddit.com/api/v1/authorize');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=identity+submit+read');
      expect(authUrl).toContain('duration=permanent');
      expect(authUrl).toContain('state=web%3Aservice');
    });

    it('should include client_id in auth URL', () => {
      const authUrl = redditOAuth.getAuthUrl();

      expect(authUrl).toContain('client_id=');
    });

    it('should include redirect_uri in auth URL', () => {
      const authUrl = redditOAuth.getAuthUrl();

      expect(authUrl).toContain('redirect_uri=');
    });
  });

  describe('extractCodeFromUrl', () => {
    it('should extract code from URL', () => {
      const url =
        'http://localhost:8081/service/callback?code=test-code&state=reddit:service_link';
      const code = redditOAuth.extractCodeFromUrl(url);

      expect(code).toBe('test-code');
    });

    it('should return null if no code in URL', () => {
      const url = 'http://localhost:8081/service/callback';
      const code = redditOAuth.extractCodeFromUrl(url);

      expect(code).toBeNull();
    });

    it('should extract code with special characters', () => {
      const url =
        'http://localhost:8081/service/callback?code=abc123-xyz_789&state=reddit:service_link';
      const code = redditOAuth.extractCodeFromUrl(url);

      expect(code).toBe('abc123-xyz_789');
    });
  });

  describe('extractErrorFromUrl', () => {
    it('should extract error from URL', () => {
      const url =
        'http://localhost:8081/service/callback?error=access_denied&state=reddit:service_link';
      const error = redditOAuth.extractErrorFromUrl(url);

      expect(error).toBe('access_denied');
    });

    it('should return null if no error in URL', () => {
      const url =
        'http://localhost:8081/service/callback?code=test-code&state=reddit:service_link';
      const error = redditOAuth.extractErrorFromUrl(url);

      expect(error).toBeNull();
    });
  });

  describe('initiate', () => {
    it('should redirect to Reddit OAuth URL', () => {
      const originalLocation = window.location.href;

      // Mock window.location
      const mockLocation = { href: '' } as Location;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: mockLocation,
      });

      redditOAuth.initiate();

      expect(window.location.href).toContain(
        'https://www.reddit.com/api/v1/authorize',
      );

      // Restore
      window.location.href = originalLocation;
    });
  });

  describe('configuration', () => {
    it('should have clientId property', () => {
      expect(redditOAuth).toHaveProperty('clientId');
    });

    it('should have redirectUri property', () => {
      expect(redditOAuth).toHaveProperty('redirectUri');
    });

    it('should have all required methods', () => {
      expect(redditOAuth).toHaveProperty('getAuthUrl');
      expect(redditOAuth).toHaveProperty('extractCodeFromUrl');
      expect(redditOAuth).toHaveProperty('extractErrorFromUrl');
      expect(redditOAuth).toHaveProperty('initiate');
    });
  });
});
