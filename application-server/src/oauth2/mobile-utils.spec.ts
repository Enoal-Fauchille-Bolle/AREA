/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  isMobileRequest,
  handleMobileCallback,
  handleNonMobileRequest,
} from './mobile-utils';
import { OAuthProvider } from './dto';

describe('mobile-utils', () => {
  describe('isMobileRequest', () => {
    it('should return true for Android user agent', () => {
      const userAgent =
        'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36';
      expect(isMobileRequest(userAgent)).toBe(true);
    });

    it('should return true for iPhone user agent', () => {
      const userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15';
      expect(isMobileRequest(userAgent)).toBe(true);
    });

    it('should return true for iPad user agent', () => {
      const userAgent =
        'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15';
      expect(isMobileRequest(userAgent)).toBe(true);
    });

    it('should return true for iPod user agent', () => {
      const userAgent =
        'Mozilla/5.0 (iPod touch; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15';
      expect(isMobileRequest(userAgent)).toBe(true);
    });

    it('should return true for BlackBerry user agent', () => {
      const userAgent =
        'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+';
      expect(isMobileRequest(userAgent)).toBe(true);
    });

    it('should return true for Windows Phone user agent', () => {
      const userAgent =
        'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950)';
      expect(isMobileRequest(userAgent)).toBe(true);
    });

    it('should return false for desktop Chrome user agent', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      expect(isMobileRequest(userAgent)).toBe(false);
    });

    it('should return false for desktop Firefox user agent', () => {
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      expect(isMobileRequest(userAgent)).toBe(false);
    });

    it('should return false for desktop Safari user agent', () => {
      const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
      expect(isMobileRequest(userAgent)).toBe(false);
    });

    it('should return false for empty user agent', () => {
      expect(isMobileRequest('')).toBe(false);
    });

    it('should return false for undefined user agent', () => {
      expect(isMobileRequest(undefined as any)).toBe(false);
    });

    it('should return false for null user agent', () => {
      expect(isMobileRequest(null as any)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isMobileRequest('android device')).toBe(true);
      expect(isMobileRequest('ANDROID DEVICE')).toBe(true);
      expect(isMobileRequest('iPhone')).toBe(true);
      expect(isMobileRequest('iphone')).toBe(true);
    });
  });

  describe('handleMobileCallback', () => {
    let mockConfigService: ConfigService;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockConfigService = {
        get: jest.fn().mockReturnValue({
          oauth2: {
            auth: {
              mobile_scheme: 'area://auth/callback',
            },
            service: {
              mobile_scheme: 'area://service/callback',
            },
          },
        }),
      } as any;

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        contentType: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
    });

    it('should return mobile redirect HTML for auth callback', () => {
      const provider: OAuthProvider = OAuthProvider.DISCORD;
      const code = 'test_auth_code_123';

      handleMobileCallback(
        mockResponse as Response,
        provider,
        code,
        'auth',
        mockConfigService,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.contentType).toHaveBeenCalledWith('text/html');
      expect(mockResponse.send).toHaveBeenCalled();

      const htmlContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('area://auth/callback');
      expect(htmlContent).toContain(encodeURIComponent(code));
      expect(htmlContent).toContain(provider);
    });

    it('should return mobile redirect HTML for service callback', () => {
      const provider: OAuthProvider = OAuthProvider.GMAIL;
      const code = 'test_service_code_456';

      handleMobileCallback(
        mockResponse as Response,
        provider,
        code,
        'service',
        mockConfigService,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.contentType).toHaveBeenCalledWith('text/html');
      expect(mockResponse.send).toHaveBeenCalled();

      const htmlContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('area://service/callback');
      expect(htmlContent).toContain(encodeURIComponent(code));
      expect(htmlContent).toContain(provider);
    });

    it('should encode special characters in code', () => {
      const provider: OAuthProvider = OAuthProvider.GITHUB;
      const code = 'test&code=with&special=chars';

      handleMobileCallback(
        mockResponse as Response,
        provider,
        code,
        'auth',
        mockConfigService,
      );

      const htmlContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(htmlContent).toContain(encodeURIComponent(code));
      // The encoded version appears in the deep link URL
      expect(htmlContent).toContain('test%26code%3Dwith%26special%3Dchars');
    });

    it('should handle different OAuth providers', () => {
      const providers: OAuthProvider[] = [
        OAuthProvider.DISCORD,
        OAuthProvider.GOOGLE,
        OAuthProvider.GMAIL,
        OAuthProvider.GITHUB,
        OAuthProvider.SPOTIFY,
        OAuthProvider.TWITCH,
      ];

      for (const provider of providers) {
        mockResponse.send = jest.fn().mockReturnThis();

        handleMobileCallback(
          mockResponse as Response,
          provider,
          'test_code',
          'auth',
          mockConfigService,
        );

        const htmlContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
        expect(htmlContent).toContain(provider);
      }
    });

    it('should include fallback link in HTML', () => {
      handleMobileCallback(
        mockResponse as Response,
        OAuthProvider.DISCORD,
        'test_code',
        'auth',
        mockConfigService,
      );

      const htmlContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('Click here');
      expect(htmlContent).toContain('area://auth/callback');
    });

    it('should get correct config for auth context', () => {
      handleMobileCallback(
        mockResponse as Response,
        OAuthProvider.DISCORD,
        'test_code',
        'auth',
        mockConfigService,
      );

      expect(mockConfigService.get).toHaveBeenCalledWith('app');
    });

    it('should get correct config for service context', () => {
      handleMobileCallback(
        mockResponse as Response,
        OAuthProvider.GMAIL,
        'test_code',
        'service',
        mockConfigService,
      );

      expect(mockConfigService.get).toHaveBeenCalledWith('app');
    });
  });

  describe('handleNonMobileRequest', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        contentType: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
    });

    it('should return 400 status code', () => {
      handleNonMobileRequest(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should set HTML content type', () => {
      handleNonMobileRequest(mockResponse as Response);

      expect(mockResponse.contentType).toHaveBeenCalledWith('text/html');
    });

    it('should return error message HTML', () => {
      handleNonMobileRequest(mockResponse as Response);

      expect(mockResponse.send).toHaveBeenCalled();
      const htmlContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('Mobile Only Endpoint');
      expect(htmlContent).toContain('mobile OAuth2 redirects');
    });

    it('should include styled error page', () => {
      handleNonMobileRequest(mockResponse as Response);

      const htmlContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<style>');
      expect(htmlContent).toContain('</style>');
    });

    it('should have proper HTML structure', () => {
      handleNonMobileRequest(mockResponse as Response);

      const htmlContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('<html');
      expect(htmlContent).toContain('<head>');
      expect(htmlContent).toContain('<body>');
      expect(htmlContent).toContain('</html>');
    });

    it('should be mobile-responsive', () => {
      handleNonMobileRequest(mockResponse as Response);

      const htmlContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(htmlContent).toContain('viewport');
      expect(htmlContent).toContain('width=device-width');
    });
  });
});
