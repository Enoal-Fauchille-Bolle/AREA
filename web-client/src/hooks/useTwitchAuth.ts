import { useState, useEffect } from 'react';
import { servicesApi } from '../services/api';

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string | null;
  email?: string;
}

export const useTwitchAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [twitchUser, setTwitchUser] = useState<TwitchUser | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const profile = await servicesApi.getTwitchProfile();
        setTwitchUser(profile);
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
        setTwitchUser(null);
      }
    };

    checkConnection();
  }, []);

  const connectToTwitch = async (serviceId: number) => {
    try {
      setIsConnecting(true);

      const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID;
      const redirectUri = `${window.location.origin}/service/callback`;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      const scope = encodeURIComponent('user:read:email user:write:chat');
      const state = encodeURIComponent('twitch:service_link');

      if (!clientId) {
        throw new Error('Twitch OAuth2 not configured');
      }

      const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}`;

      let popup: Window | null = null;

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'TWITCH_OAUTH_SUCCESS' && event.data.code) {
          try {
            await servicesApi.linkService(serviceId, event.data.code);
            setIsConnected(true);

            try {
              const profile = await servicesApi.getTwitchProfile();
              setTwitchUser(profile);
            } catch {
              setTwitchUser({
                id: 'connected',
                login: 'Twitch User',
                display_name: 'Twitch User',
                profile_image_url: null,
                email: undefined,
              });
            }

            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
          } catch (error) {
            throw error;
          } finally {
            window.removeEventListener('message', messageListener);
            setIsConnecting(false);
          }
        } else if (event.data.type === 'TWITCH_OAUTH_ERROR') {
          if (popup && !popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
          throw new Error(event.data.error || 'Failed to connect Twitch');
        }
      };

      window.addEventListener('message', messageListener);

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      popup = window.open(
        twitchAuthUrl,
        'TwitchAuth',
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!popup) {
        throw new Error('Failed to open OAuth popup');
      }

      const checkClosed = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
        }
      }, 1000);
    } catch (error) {
      setIsConnecting(false);
      throw error;
    }
  };

  const disconnectTwitch = async () => {
    try {
      await servicesApi.disconnectService('twitch');
      setIsConnected(false);
      setTwitchUser(null);
    } catch (error) {
      throw error;
    }
  };

  return {
    isConnecting,
    isConnected,
    twitchUser,
    connectToTwitch,
    disconnectTwitch,
  };
};
