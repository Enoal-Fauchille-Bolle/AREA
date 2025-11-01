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
        const userServices = await servicesApi.getUserServices();
        const githubService = userServices.find(
          (s) => s.name.toLowerCase() === 'github',
        );

        if (githubService) {
          const profile = await servicesApi.getGitHubProfile();
          setGitHubUser(profile);
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setGitHubUser(null);
        }
      } catch {
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

      if (!clientId) {
        throw new Error('GitHub OAuth2 not configured');
      }

      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&state=${state}`;

      let popup: Window | null = null;

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GITHUB_OAUTH_SUCCESS' && event.data.code) {
          try {
            await servicesApi.linkService(serviceId, event.data.code);
            setIsConnected(true);

            try {
              const profile = await servicesApi.getGitHubProfile();
              setGitHubUser(profile);
            } catch {
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

            const githubAppInstalled = localStorage.getItem(
              'github_app_installed',
            );

            if (githubAppInstalled === 'true') {
              console.log(
                'GitHub App already installed, skipping installation popup',
              );
              return;
            }

            let installAppUrl =
              'https://github.com/apps/area-app-epitech/installations/new';

            const setupCallbackUrl = `${window.location.origin}/auth/callback`;
            installAppUrl += `?setup_url=${encodeURIComponent(setupCallbackUrl)}`;

            try {
              const profile = await servicesApi.getGitHubProfile();
              if (profile && profile.id) {
                installAppUrl += `&suggested_target_id=${profile.id}`;
              }
            } catch {
              // Failed to get profile, continue without suggested_target_id
            }

            setTimeout(() => {
              const installPopup = window.open(
                installAppUrl,
                'github-app-install',
                'width=800,height=700,scrollbars=yes,resizable=yes',
              );

              if (installPopup) {
                const installMessageListener = (event: MessageEvent) => {
                  if (event.origin !== window.location.origin) {
                    return;
                  }

                  if (event.data.type === 'GITHUB_APP_INSTALLED') {
                    console.log(
                      'GitHub App installed with installation_id:',
                      event.data.installationId,
                    );
                    localStorage.setItem('github_app_installed', 'true');
                    clearInterval(installCheckInterval);
                    window.removeEventListener(
                      'message',
                      installMessageListener,
                    );
                  }
                };

                window.addEventListener('message', installMessageListener);

                const installCheckInterval = setInterval(() => {
                  try {
                    if (installPopup.closed) {
                      clearInterval(installCheckInterval);
                      window.removeEventListener(
                        'message',
                        installMessageListener,
                      );
                      console.log('GitHub App installation popup closed');
                    }
                  } catch {
                    // Popup closed or access denied
                  }
                }, 1000);

                setTimeout(() => {
                  clearInterval(installCheckInterval);
                  window.removeEventListener('message', installMessageListener);
                  if (installPopup && !installPopup.closed) {
                    installPopup.close();
                  }
                }, 300000);
              }
            }, 500);
          } catch (error) {
            if (popup && !popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            setIsConnecting(false);
            throw error;
          }
        } else if (event.data.type === 'GITHUB_OAUTH_ERROR') {
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
    githubUser,
    connectToGitHub,
  };
};
