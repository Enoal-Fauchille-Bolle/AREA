import { useState, useEffect } from 'react';
import { servicesApi } from '../services/api';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export const useDiscordAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('Checking Discord connection at startup...');
        const profile = await servicesApi.getDiscordProfile();
        console.log('Discord profile at startup:', profile);
        setDiscordUser(profile);
        setIsConnected(true);
      } catch (error) {
        console.log('Discord not connected at startup:', error);
        setIsConnected(false);
        setDiscordUser(null);
      }
    };

    checkConnection();
  }, []);

  const connectToDiscord = async (serviceId: number) => {
    try {
      setIsConnecting(true);

      const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
      const redirectUri = `${window.location.origin}/service/callback`;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      const scope = encodeURIComponent('identify email guilds');
      console.log('Discord OAuth2 config:', {
        clientId,
        redirectUri,
        encodedRedirectUri,
        origin: window.location.origin,
      });

      if (!clientId) {
        throw new Error('Discord OAuth2 not configured');
      }

      const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}`;
      console.log('Discord auth URL:', discordAuthUrl);

      let popup: Window | null = null;
      let checkClosed: NodeJS.Timeout;

      const messageListener = async (event: MessageEvent) => {
        console.log('=== Message received in parent window ===');
        console.log('Event origin:', event.origin);
        console.log('Window origin:', window.location.origin);
        console.log('Event data:', event.data);
        if (event.origin !== window.location.origin) {
          console.log('Origin mismatch, ignoring message');
          return;
        }

        if (event.data.type === 'DISCORD_OAUTH_SUCCESS' && event.data.code) {
          console.log('Received Discord OAuth success');
          try {
            console.log('Attempting to link Discord service with ID:', serviceId);
            await servicesApi.linkService(serviceId, event.data.code);
            console.log('Successfully linked Discord service');
            setIsConnected(true);
            try {
              const profile = await servicesApi.getDiscordProfile();
              console.log('Discord profile received:', profile);
              setDiscordUser(profile);
            } catch {
              console.log('Could not fetch Discord profile, using placeholder');
              setDiscordUser({
                id: 'connected',
                username: 'Discord User',
                discriminator: '0000',
                avatar: null,
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
            console.error('Failed to link Discord service:', error);
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            setIsConnecting(false);
            throw error;
          }
        } else if (event.data.type === 'DISCORD_OAUTH_ERROR') {
          console.error('Discord OAuth error:', event.data.error);
          if (popup && !popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
          throw new Error(event.data.error || 'Discord OAuth2 failed');
        }
      };

      window.addEventListener('message', messageListener);
      console.log('Message listener attached');

      popup = window.open(
        discordAuthUrl,
        'discord-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes',
      );

      if (!popup) {
        window.removeEventListener('message', messageListener);
        setIsConnecting(false);
        throw new Error('Failed to open Discord OAuth2 popup');
      }

      checkClosed = setInterval(() => {
        if (popup && popup.closed) {
          console.log('Popup closed by user');
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
        }
      }, 1000);

      setTimeout(() => {
        if (popup && !popup.closed) {
          console.log('OAuth timeout, closing popup');
          popup.close();
        }
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        setIsConnecting(false);
      }, 300000);
    } catch (error) {
      setIsConnecting(false);
      throw error;
    }
  };

  return {
    isConnecting,
    isConnected,
    discordUser,
    connectToDiscord,
  };
};
