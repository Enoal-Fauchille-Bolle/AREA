import { useState } from 'react';
import { servicesApi } from '../services/api';

export const useDiscordAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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
        origin: window.location.origin
      });

      if (!clientId) {
        throw new Error('Discord OAuth2 not configured');
      }

      const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}`;
      console.log('Discord auth URL:', discordAuthUrl);

      const popup = window.open(
        discordAuthUrl,
        'discord-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Failed to open Discord OAuth2 popup');
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
        }
      }, 1000);

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'DISCORD_OAUTH_SUCCESS' && event.data.code) {
          console.log('Received Discord OAuth success with code:', event.data.code);
          try {
            console.log('Attempting to link Discord service with ID:', serviceId);
            await servicesApi.linkService(serviceId, event.data.code);
            console.log('Successfully linked Discord service');
            setIsConnected(true);
            popup.close();
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
          } catch (error) {
            console.error('Failed to link Discord service:', error);
            popup.close();
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            throw error;
          }
        } else if (event.data.type === 'DISCORD_OAUTH_ERROR') {
          console.error('Discord OAuth error:', event.data.error);
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          throw new Error(event.data.error || 'Discord OAuth2 failed');
        }
      };

      window.addEventListener('message', messageListener);

      setTimeout(() => {
        if (!popup.closed) {
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
    connectToDiscord,
  };
};