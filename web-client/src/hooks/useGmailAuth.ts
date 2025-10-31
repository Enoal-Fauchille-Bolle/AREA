import { useState, useEffect } from 'react';
import { servicesApi } from '../services/api';

interface GmailUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export const useGmailAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [gmailUser, setGmailUser] = useState<GmailUser | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const services = await servicesApi.getUserServices();
        const gmailService = services.find(
          (s) => s.name.toLowerCase() === 'gmail',
        );
        if (gmailService) {
          setIsConnected(true);
          // Fetch real profile data
          try {
            const profile = await servicesApi.getGmailProfile();
            setGmailUser(profile);
          } catch {
            // If profile fetch fails, still mark as connected but without profile
            setGmailUser({
              id: 'connected',
              email: 'Gmail User',
              name: undefined,
              picture: undefined,
            });
          }
        } else {
          setIsConnected(false);
          setGmailUser(null);
        }
      } catch {
        setIsConnected(false);
        setGmailUser(null);
      }
    };

    checkConnection();
  }, []);

  const connectToGmail = async (serviceId: number) => {
    try {
      setIsConnecting(true);

      const clientId = import.meta.env.VITE_GMAIL_CLIENT_ID;
      const redirectUri = `${window.location.origin}/service/callback`;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      const scope = encodeURIComponent(
        'https://www.googleapis.com/auth/gmail.modify openid email profile',
      );
      const state = encodeURIComponent('gmail:service_link');

      if (!clientId) {
        throw new Error('Gmail OAuth2 not configured');
      }

      const gmailAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

      let popup: Window | null = null;

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GMAIL_OAUTH_SUCCESS' && event.data.code) {
          try {
            await servicesApi.linkService(serviceId, event.data.code);
            setIsConnected(true);
            // Fetch real profile data after successful connection
            try {
              const profile = await servicesApi.getGmailProfile();
              setGmailUser(profile);
            } catch {
              // If profile fetch fails, still mark as connected but without profile
              setGmailUser({
                id: 'connected',
                email: 'Gmail User',
                name: undefined,
                picture: undefined,
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
        } else if (event.data.type === 'GMAIL_OAUTH_ERROR') {
          if (popup && !popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
          throw new Error(event.data.error || 'Gmail OAuth2 failed');
        }
      };

      window.addEventListener('message', messageListener);

      popup = window.open(
        gmailAuthUrl,
        'gmail-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes',
      );

      if (!popup) {
        window.removeEventListener('message', messageListener);
        setIsConnecting(false);
        throw new Error('Failed to open Gmail OAuth2 popup');
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

  return {
    isConnecting,
    isConnected,
    gmailUser,
    connectToGmail,
  };
};
