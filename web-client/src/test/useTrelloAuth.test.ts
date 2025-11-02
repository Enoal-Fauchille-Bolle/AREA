import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTrelloAuth } from '../hooks/useTrelloAuth';
import { servicesApi } from '../services/api';

vi.mock('../services/api', () => ({
  servicesApi: {
    getUserServices: vi.fn(),
    getTrelloProfile: vi.fn(),
    linkTrelloService: vi.fn(),
    disconnectService: vi.fn(),
  },
}));

describe('useTrelloAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with disconnected state', () => {
    vi.mocked(servicesApi.getUserServices).mockResolvedValue([]);

    const { result } = renderHook(() => useTrelloAuth());

    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.trelloUser).toBeNull();
  });

  it('should check connection on mount', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'Trello',
        description: 'Trello service',
        icon_path: null,
        requires_auth: true,
        is_active: true,
      },
    ];
    const mockProfile = {
      id: 'user123',
      username: 'testuser',
      fullName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    };

    vi.mocked(servicesApi.getUserServices).mockResolvedValue(mockServices);
    vi.mocked(servicesApi.getTrelloProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useTrelloAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(result.current.trelloUser).toEqual(mockProfile);
    expect(servicesApi.getUserServices).toHaveBeenCalled();
    expect(servicesApi.getTrelloProfile).toHaveBeenCalled();
  });

  it('should handle connection check errors gracefully', async () => {
    vi.mocked(servicesApi.getUserServices).mockRejectedValue(
      new Error('Network error'),
    );

    const { result } = renderHook(() => useTrelloAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    expect(result.current.trelloUser).toBeNull();
  });

  it('should handle profile fetch errors gracefully', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'Trello',
        description: 'Trello service',
        icon_path: null,
        requires_auth: true,
        is_active: true,
      },
    ];

    vi.mocked(servicesApi.getUserServices).mockResolvedValue(mockServices);
    vi.mocked(servicesApi.getTrelloProfile).mockRejectedValue(
      new Error('Profile error'),
    );

    const { result } = renderHook(() => useTrelloAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should provide connectToTrello function', () => {
    vi.mocked(servicesApi.getUserServices).mockResolvedValue([]);

    const { result } = renderHook(() => useTrelloAuth());

    expect(result.current.connectToTrello).toBeDefined();
    expect(typeof result.current.connectToTrello).toBe('function');
  });

  it('should provide disconnectTrello function', () => {
    vi.mocked(servicesApi.getUserServices).mockResolvedValue([]);

    const { result } = renderHook(() => useTrelloAuth());

    expect(result.current.disconnectTrello).toBeDefined();
    expect(typeof result.current.disconnectTrello).toBe('function');
  });

  it('should disconnect from Trello successfully', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'Trello',
        description: 'Trello service',
        icon_path: null,
        requires_auth: true,
        is_active: true,
      },
    ];
    const mockProfile = {
      id: 'user123',
      username: 'testuser',
      fullName: 'Test User',
      avatarUrl: null,
    };

    vi.mocked(servicesApi.getUserServices).mockResolvedValue(mockServices);
    vi.mocked(servicesApi.getTrelloProfile).mockResolvedValue(mockProfile);
    vi.mocked(servicesApi.disconnectService).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTrelloAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    await result.current.disconnectTrello();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.trelloUser).toBeNull();
    });

    expect(servicesApi.disconnectService).toHaveBeenCalledWith('trello');
  });

  it('should handle case-insensitive service name matching', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'TRELLO',
        description: 'Trello service',
        icon_path: null,
        requires_auth: true,
        is_active: true,
      },
    ];
    const mockProfile = {
      id: 'user123',
      username: 'testuser',
      fullName: 'Test User',
      avatarUrl: null,
    };

    vi.mocked(servicesApi.getUserServices).mockResolvedValue(mockServices);
    vi.mocked(servicesApi.getTrelloProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useTrelloAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(result.current.trelloUser).toEqual(mockProfile);
  });
});
