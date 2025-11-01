import { describe, it, expect, vi, beforeEach } from 'vitest';
import { areasApi, authApi, servicesApi, tokenService } from '../services/api';

const API_BASE_URL = 'http://localhost:8080';

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Set a default token for tests that need authentication
    tokenService.setToken('test-token');
  });

  describe('tokenService', () => {
    beforeEach(() => {
      // Clear token for tokenService tests
      tokenService.removeToken();
    });

    it('stores token correctly', () => {
      tokenService.setToken('new-test-token');
      expect(tokenService.getToken()).toBe('new-test-token');
    });

    it('retrieves token from localStorage', () => {
      localStorage.setItem('auth_token', 'stored-token');
      expect(tokenService.getToken()).toBe('stored-token');
    });

    it('removes token correctly', () => {
      tokenService.setToken('new-test-token');
      tokenService.removeToken();
      expect(tokenService.getToken()).toBeNull();
    });

    it('checks if user is authenticated', () => {
      expect(tokenService.isAuthenticated()).toBe(false);
      tokenService.setToken('new-test-token');
      expect(tokenService.isAuthenticated()).toBe(true);
    });
  });

  describe('Auth API', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };
      const mockResponse = {
        token: 'test-token',
        user: { id: 1, ...userData },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.register(userData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        }),
      );
    });

    it('should login a user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResponse = {
        token: 'test-token',
        user: { id: 1, email: credentials.email },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.login(credentials);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        }),
      );
    });

    it('should get current user profile', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      });

      const result = await authApi.getProfile();

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/me`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should handle authentication errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(
        authApi.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow();
    });
  });

  describe('Areas API', () => {
    it('should get all areas', async () => {
      const mockAreas = [
        { id: 1, name: 'Test Area', is_active: true },
        { id: 2, name: 'Another Area', is_active: false },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAreas,
      });

      const result = await areasApi.getAreas();

      expect(result).toEqual(mockAreas);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/areas`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should create a new area', async () => {
      const newArea = {
        name: 'New Test Area',
        description: 'Test Description',
        component_action_id: 1,
        component_reaction_id: 2,
        is_active: true,
      };
      const mockResponse = { data: { id: 3, ...newArea } };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await areasApi.createArea(newArea);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/areas`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newArea),
        }),
      );
    });

    it('should update an area', async () => {
      const mockResponse = { data: { id: 1, is_active: false } };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await areasApi.updateArea(1, { is_active: false });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/areas/1`,
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });

    it('should delete an area', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      await areasApi.deleteArea(1);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/areas/1`,
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('should handle unauthorized access', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(areasApi.getAreas()).rejects.toThrow();
    });
  });

  describe('Services API', () => {
    it('should get all services', async () => {
      const mockServices = [
        { id: 1, name: 'Discord', slug: 'discord' },
        { id: 2, name: 'GitHub', slug: 'github' },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockServices,
      });

      const result = await servicesApi.getServices();

      expect(result).toEqual(mockServices);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/services`,
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should get user services', async () => {
      const mockConnectedServices = [
        { id: 1, name: 'Discord', slug: 'discord' },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConnectedServices,
      });

      const result = await servicesApi.getUserServices();

      expect(result).toEqual(mockConnectedServices);
    });

    it('should link a service', async () => {
      const mockResponse = { data: { success: true } };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await servicesApi.linkService(1, 'auth-code');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/services/1/link`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: 'auth-code', platform: 'web' }),
        }),
      );
    });

    it('should disconnect a service', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await servicesApi.disconnectService('discord');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/services/discord/disconnect`,
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('should handle service connection errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid code' }),
      });

      await expect(
        servicesApi.linkService(1, 'invalid-code'),
      ).rejects.toThrow();
    });
  });
});
