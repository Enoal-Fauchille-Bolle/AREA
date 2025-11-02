import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trelloOAuth } from '../lib/trelloOAuth';

describe('Trello OAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthUrl', () => {
    it('should generate correct Trello OAuth URL', () => {
      const authUrl = trelloOAuth.getAuthUrl();

      expect(authUrl).toContain('https://trello.com/1/authorize');
      expect(authUrl).toContain('response_type=token');
      expect(authUrl).toContain('scope=read%2Cwrite');
      expect(authUrl).toContain('expiration=never');
      expect(authUrl).toContain('name=AREA+App+Integration');
    });

    it('should include api key in auth URL', () => {
      const authUrl = trelloOAuth.getAuthUrl();

      expect(authUrl).toContain('key=');
    });

    it('should include return_url in auth URL', () => {
      const authUrl = trelloOAuth.getAuthUrl();

      expect(authUrl).toContain('return_url=');
      expect(authUrl).toContain('state%3Dtrello%3Aservice_link');
    });
  });

  describe('extractTokenFromUrl', () => {
    it('should extract token from URL hash', () => {
      const url =
        'http://localhost:8081/service/callback?state=trello:service_link#token=abc123def456';
      const token = trelloOAuth.extractTokenFromUrl(url);

      expect(token).toBe('abc123def456');
    });

    it('should return null if no token in URL', () => {
      const url =
        'http://localhost:8081/service/callback?state=trello:service_link';
      const token = trelloOAuth.extractTokenFromUrl(url);

      expect(token).toBeNull();
    });

    it('should extract token with special characters', () => {
      const url =
        'http://localhost:8081/service/callback#token=abc123-xyz_789.ghi';
      const token = trelloOAuth.extractTokenFromUrl(url);

      expect(token).toBe('abc123-xyz_789.ghi');
    });

    it('should handle token in middle of hash parameters', () => {
      const url =
        'http://localhost:8081/service/callback#foo=bar&token=mytoken123&baz=qux';
      const token = trelloOAuth.extractTokenFromUrl(url);

      expect(token).toBe('mytoken123');
    });
  });

  describe('extractErrorFromUrl', () => {
    it('should extract error from URL', () => {
      const url =
        'http://localhost:8081/service/callback?error=access_denied&state=trello:service_link';
      const error = trelloOAuth.extractErrorFromUrl(url);

      expect(error).toBe('access_denied');
    });

    it('should return null if no error in URL', () => {
      const url =
        'http://localhost:8081/service/callback?state=trello:service_link#token=test-token';
      const error = trelloOAuth.extractErrorFromUrl(url);

      expect(error).toBeNull();
    });
  });

  describe('initiate', () => {
    it('should redirect to Trello OAuth URL', () => {
      const originalLocation = window.location.href;

      // Mock window.location
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });

      trelloOAuth.initiate();

      expect(window.location.href).toContain('https://trello.com/1/authorize');

      // Restore
      window.location.href = originalLocation;
    });
  });

  describe('configuration', () => {
    it('should have apiKey property', () => {
      expect(trelloOAuth).toHaveProperty('apiKey');
    });

    it('should have all required methods', () => {
      expect(trelloOAuth).toHaveProperty('getAuthUrl');
      expect(trelloOAuth).toHaveProperty('extractTokenFromUrl');
      expect(trelloOAuth).toHaveProperty('extractErrorFromUrl');
      expect(trelloOAuth).toHaveProperty('initiate');
    });
  });
});
