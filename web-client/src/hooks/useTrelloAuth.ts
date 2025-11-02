import { useState, useEffect } from 'react';
import { servicesApi } from '../services/api';

interface TrelloUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  email?: string;
}

export const useTrelloAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [trelloUser, setTrelloUser] = useState<TrelloUser | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const userServices = await servicesApi.getUserServices();
        const trelloService = userServices.find(
          (s) => s.name.toLowerCase() === 'trello',
        );

        if (trelloService) {
          const profile = await servicesApi.getTrelloProfile();
          setTrelloUser(profile);
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setTrelloUser(null);
        }
      } catch {
        setIsConnected(false);
        setTrelloUser(null);
      }
    };

    checkConnection();
  }, []);

  const connectToTrello = async (_serviceId: number) => {
    // Note: serviceId is not used for Trello as the backend uses a special endpoint
    // that doesn't require the serviceId, but we keep it for consistency with other OAuth hooks
    void _serviceId;
    try {
      setIsConnecting(true);

      const apiKey = import.meta.env.VITE_TRELLO_API_KEY;
      const redirectUri = `${window.location.origin}/service/callback?state=trello:service_link`;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      const scope = encodeURIComponent('read,write');
      const appName = encodeURIComponent('AREA App Integration');

      if (!apiKey) {
        throw new Error('Trello API key not configured');
      }

      const trelloAuthUrl = `https://trello.com/1/authorize?expiration=never&name=${appName}&scope=${scope}&response_type=token&key=${apiKey}&return_url=${encodedRedirectUri}`;

      let popup: Window | null = null;

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'TRELLO_OAUTH_SUCCESS' && event.data.token) {
          try {
            await servicesApi.linkTrelloService(event.data.token);
            setIsConnected(true);

            try {
              const profile = await servicesApi.getTrelloProfile();
              setTrelloUser(profile);
            } catch {
              setTrelloUser({
                id: 'connected',
                username: 'Trello User',
                fullName: 'Trello User (Connected)',
                avatarUrl: null,
                email: undefined,
              });
            }

            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            setIsConnecting(false);
          } catch (error) {
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            setIsConnecting(false);
            throw error;
          }
        } else if (event.data.type === 'TRELLO_OAUTH_ERROR') {
          if (popup && !popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
          throw new Error(event.data.error || 'Trello OAuth failed');
        }
      };

      window.addEventListener('message', messageListener);

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      popup = window.open(
        trelloAuthUrl,
        'TrelloAuth',
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!popup) {
        window.removeEventListener('message', messageListener);
        setIsConnecting(false);
        throw new Error('Failed to open Trello OAuth popup');
      }

      const checkClosed = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
        }
      }, 1000);

      setTimeout(() => {
        if (popup && !popup.closed) {
          popup.close();
        }
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        setIsConnecting(false);
      }, 300000); // 5 minutes timeout
    } catch (error) {
      setIsConnecting(false);
      throw error;
    }
  };

  const disconnectTrello = async () => {
    await servicesApi.disconnectService('trello');
    setIsConnected(false);
    setTrelloUser(null);
  };

  return {
    isConnecting,
    isConnected,
    trelloUser,
    connectToTrello,
    disconnectTrello,
  };
};
