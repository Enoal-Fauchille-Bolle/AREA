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
        console.log('Checking Twitch connection at startup...');
        const profile = await servicesApi.getTwitchProfile();
        console.log('Twitch profile at startup:', profile);
        setTwitchUser(profile);
        setIsConnected(true);
      } catch (error) {
        console.log('Twitch not connected at startup:', error);
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

      console.log('Twitch OAuth2 config:', {
        clientId,
        redirectUri,
        encodedRedirectUri,
        state,
        origin: window.location.origin,
      });

      if (!clientId) {
        throw new Error('Twitch OAuth2 not configured');
      }

      const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}`;
      console.log('Twitch auth URL:', twitchAuthUrl);

      let popup: Window | null = null;

      const messageListener = async (event: MessageEvent) => {
        console.log('=== Message received in parent window ===');
        console.log('Event origin:', event.origin);
        console.log('Window origin:', window.location.origin);
        console.log('Event data:', event.data);

        if (event.origin !== window.location.origin) {
          console.log('Origin mismatch, ignoring message');
          return;
        }

        if (event.data.type === 'TWITCH_OAUTH_SUCCESS' && event.data.code) {
          console.log('Received Twitch OAuth success');
          try {
            console.log(
              'Attempting to link Twitch service with ID:',
              serviceId,
            );
            await servicesApi.linkService(serviceId, event.data.code);
            console.log('Successfully linked Twitch service');
            setIsConnected(true);

            try {
              const profile = await servicesApi.getTwitchProfile();
              console.log('Twitch profile received:', profile);
              setTwitchUser(profile);
            } catch {
              console.log('Could not fetch Twitch profile, using placeholder');
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
            console.error('Failed to link Twitch service:', error);
            throw error;
          } finally {
            window.removeEventListener('message', messageListener);
            setIsConnecting(false);
          }
        } else if (event.data.type === 'TWITCH_OAUTH_ERROR') {
          console.error('Twitch OAuth error:', event.data.error);
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

      console.log('Opening Twitch OAuth popup...');
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
          console.log('Popup was closed by user');
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
        }
      }, 1000);
    } catch (error) {
      console.error('Error connecting to Twitch:', error);
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
      console.error('Failed to disconnect Twitch:', error);
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
