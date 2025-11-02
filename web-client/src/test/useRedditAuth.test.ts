import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRedditAuth } from '../hooks/useRedditAuth';
import { servicesApi } from '../services/api';

vi.mock('../services/api', () => ({
  servicesApi: {
    getUserServices: vi.fn(),
    getRedditProfile: vi.fn(),
    linkService: vi.fn(),
    disconnectService: vi.fn(),
  },
}));

describe('useRedditAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with disconnected state', () => {
    vi.mocked(servicesApi.getUserServices).mockResolvedValue([]);

    const { result } = renderHook(() => useRedditAuth());

    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.redditUser).toBeNull();
  });

  it('should check connection on mount', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'Reddit',
        description: 'Reddit service',
        icon_path: null,
        requires_auth: true,
        is_active: true,
      },
    ];
    const mockProfile = {
      id: 'user123',
      name: 'testuser',
      icon_img: 'https://example.com/avatar.png',
    };

    vi.mocked(servicesApi.getUserServices).mockResolvedValue(mockServices);
    vi.mocked(servicesApi.getRedditProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useRedditAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(result.current.redditUser).toEqual(mockProfile);
    expect(servicesApi.getUserServices).toHaveBeenCalled();
    expect(servicesApi.getRedditProfile).toHaveBeenCalled();
  });

  it('should handle connection check errors gracefully', async () => {
    vi.mocked(servicesApi.getUserServices).mockRejectedValue(
      new Error('Network error'),
    );

    const { result } = renderHook(() => useRedditAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    expect(result.current.redditUser).toBeNull();
  });

  it('should handle profile fetch errors gracefully', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'Reddit',
        description: 'Reddit service',
        icon_path: null,
        requires_auth: true,
        is_active: true,
      },
    ];

    vi.mocked(servicesApi.getUserServices).mockResolvedValue(mockServices);
    vi.mocked(servicesApi.getRedditProfile).mockRejectedValue(
      new Error('Profile error'),
    );

    const { result } = renderHook(() => useRedditAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should provide connectToReddit function', () => {
    vi.mocked(servicesApi.getUserServices).mockResolvedValue([]);

    const { result } = renderHook(() => useRedditAuth());

    expect(result.current.connectToReddit).toBeDefined();
    expect(typeof result.current.connectToReddit).toBe('function');
  });

  it('should provide disconnectFromReddit function', () => {
    vi.mocked(servicesApi.getUserServices).mockResolvedValue([]);

    const { result } = renderHook(() => useRedditAuth());

    expect(result.current.disconnectFromReddit).toBeDefined();
    expect(typeof result.current.disconnectFromReddit).toBe('function');
  });

  it('should disconnect from Reddit successfully', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'Reddit',
        description: 'Reddit service',
        icon_path: null,
        requires_auth: true,
        is_active: true,
      },
    ];
    const mockProfile = {
      id: 'user123',
      name: 'testuser',
    };

    vi.mocked(servicesApi.getUserServices).mockResolvedValue(mockServices);
    vi.mocked(servicesApi.getRedditProfile).mockResolvedValue(mockProfile);
    vi.mocked(servicesApi.disconnectService).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRedditAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    await result.current.disconnectFromReddit();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.redditUser).toBeNull();
    });

    expect(servicesApi.disconnectService).toHaveBeenCalledWith('reddit');
  });

  it('should handle case-insensitive service name matching', async () => {
    const mockServices = [
      {
        id: 1,
        name: 'REDDIT',
        description: 'Reddit service',
        icon_path: null,
        requires_auth: true,
        is_active: true,
      },
    ];
    const mockProfile = {
      id: 'user123',
      name: 'testuser',
    };

    vi.mocked(servicesApi.getUserServices).mockResolvedValue(mockServices);
    vi.mocked(servicesApi.getRedditProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useRedditAuth());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(result.current.redditUser).toEqual(mockProfile);
  });
});
