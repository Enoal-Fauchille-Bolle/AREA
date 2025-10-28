import { useState, useEffect } from 'react';
import { servicesApi } from '../services/api';

interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string | null;
  email?: string;
}

export const useGitHubAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [githubUser, setGitHubUser] = useState<GitHubUser | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('Checking GitHub connection at startup...');
        const profile = await servicesApi.getGitHubProfile();
        console.log('GitHub profile at startup:', profile);
        setGitHubUser(profile);
        setIsConnected(true);
      } catch (error) {
        console.log('GitHub not connected at startup:', error);
        setIsConnected(false);
        setGitHubUser(null);
      }
    };

    checkConnection();
  }, []);

  const connectToGitHub = async (serviceId: number) => {
    try {
      setIsConnecting(true);

      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const redirectUri = `${window.location.origin}/service/callback`;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      const scope = encodeURIComponent('read:user user:email repo');
      const state = encodeURIComponent('github:service_link');

      console.log('GitHub OAuth2 config:', {
        clientId,
        redirectUri,
        encodedRedirectUri,
        state,
        origin: window.location.origin,
      });

      if (!clientId) {
        throw new Error('GitHub OAuth2 not configured');
      }

      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&state=${state}`;
      console.log('GitHub auth URL:', githubAuthUrl);

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

        if (event.data.type === 'GITHUB_OAUTH_SUCCESS' && event.data.code) {
          console.log('Received GitHub OAuth success');
          try {
            console.log(
              'Attempting to link GitHub service with ID:',
              serviceId,
            );
            await servicesApi.linkService(serviceId, event.data.code);
            console.log('Successfully linked GitHub service');
            setIsConnected(true);

            try {
              const profile = await servicesApi.getGitHubProfile();
              console.log('GitHub profile received:', profile);
              setGitHubUser(profile);
            } catch {
              console.log('Could not fetch GitHub profile, using placeholder');
              setGitHubUser({
                id: 'connected',
                login: 'GitHub User',
                avatar_url: null,
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
            console.error('Failed to link GitHub service:', error);
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            setIsConnecting(false);
            throw error;
          }
        } else if (event.data.type === 'GITHUB_OAUTH_ERROR') {
          console.error('GitHub OAuth error:', event.data.error);
          if (popup && !popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
          throw new Error(event.data.error || 'GitHub OAuth2 failed');
        }
      };

      window.addEventListener('message', messageListener);
      console.log('Message listener attached');

      popup = window.open(
        githubAuthUrl,
        'github-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes',
      );

      if (!popup) {
        window.removeEventListener('message', messageListener);
        setIsConnecting(false);
        throw new Error('Failed to open GitHub OAuth2 popup');
      }

      const checkClosed = setInterval(() => {
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
    githubUser,
    connectToGitHub,
  };
};
