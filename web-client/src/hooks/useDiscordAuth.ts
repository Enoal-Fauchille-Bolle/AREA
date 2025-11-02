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
        const userServices = await servicesApi.getUserServices();
        const discordService = userServices.find(
          (s) => s.name.toLowerCase() === 'discord',
        );

        if (discordService) {
          const profile = await servicesApi.getDiscordProfile();
          setDiscordUser(profile);
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setDiscordUser(null);
        }
      } catch {
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
      const state = encodeURIComponent('discord:service_link');

      if (!clientId) {
        throw new Error('Discord OAuth2 not configured');
      }

      const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}`;

      let popup: Window | null = null;

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'DISCORD_OAUTH_SUCCESS' && event.data.code) {
          try {
            await servicesApi.linkService(serviceId, event.data.code);
            setIsConnected(true);
            try {
              const profile = await servicesApi.getDiscordProfile();
              setDiscordUser(profile);
            } catch {
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
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            setIsConnecting(false);
            throw error;
          }
        } else if (event.data.type === 'DISCORD_OAUTH_ERROR') {
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
      }, 300000);
    } catch (error) {
      setIsConnecting(false);
      throw error;
    }
  };

  const disconnectFromDiscord = async () => {
    await servicesApi.disconnectService('discord');
    setIsConnected(false);
    setDiscordUser(null);
  };

  return {
    isConnecting,
    isConnected,
    discordUser,
    connectToDiscord,
    disconnectFromDiscord,
  };
};
