import { useState, useEffect } from 'react';
import { servicesApi } from '../services/api';

interface RedditUser {
  id: string;
  name: string;
  icon_img?: string;
  created?: number;
}

export const useRedditAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [redditUser, setRedditUser] = useState<RedditUser | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const userServices = await servicesApi.getUserServices();
        const redditService = userServices.find(
          (s) => s.name.toLowerCase() === 'reddit',
        );

        if (redditService) {
          const profile = await servicesApi.getRedditProfile();
          setRedditUser(profile);
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setRedditUser(null);
        }
      } catch {
        setIsConnected(false);
        setRedditUser(null);
      }
    };

    checkConnection();
  }, []);

  const connectToReddit = async (serviceId: number) => {
    try {
      setIsConnecting(true);

      const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID;
      const redirectUri = `${window.location.origin}/service/callback`;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      const scope = encodeURIComponent('identity submit read');
      const state = encodeURIComponent('reddit:service_link');

      if (!clientId) {
        throw new Error('Reddit OAuth2 not configured');
      }

      const redditAuthUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${encodedRedirectUri}&duration=permanent&scope=${scope}`;

      let popup: Window | null = null;

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'REDDIT_OAUTH_SUCCESS' && event.data.code) {
          await servicesApi.linkService(serviceId, event.data.code);
          setIsConnected(true);

          try {
            const profile = await servicesApi.getRedditProfile();
            setRedditUser(profile);
          } catch {
            setRedditUser({
              id: 'connected',
              name: 'Reddit User',
            });
          }

          if (popup && !popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
        } else if (event.data.type === 'REDDIT_OAUTH_ERROR') {
          if (popup && !popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
          throw new Error(event.data.error || 'Failed to connect Reddit');
        }
      };

      window.addEventListener('message', messageListener);

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      popup = window.open(
        redditAuthUrl,
        'RedditAuth',
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!popup) {
        throw new Error('Failed to open popup window');
      }

      const checkClosed = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
        }
      }, 500);
    } catch (error) {
      setIsConnecting(false);
      throw error;
    }
  };

  const disconnectFromReddit = () => {
    setIsConnected(false);
    setRedditUser(null);
  };

  return {
    isConnecting,
    isConnected,
    redditUser,
    connectToReddit,
    disconnectFromReddit,
  };
};
