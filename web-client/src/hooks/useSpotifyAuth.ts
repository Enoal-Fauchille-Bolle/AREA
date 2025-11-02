import { useState, useEffect } from 'react';
import { servicesApi } from '../services/api';

interface SpotifyUser {
  id: string;
  display_name?: string | null;
  email?: string | null;
  images?: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
}

export const useSpotifyAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const userServices = await servicesApi.getUserServices();
        const spotifyService = userServices.find(
          (service) => service.name.toLowerCase() === 'spotify',
        );

        if (spotifyService) {
          setIsConnected(true);

          try {
            const profile = await servicesApi.getSpotifyProfile();
            setSpotifyUser(profile);
          } catch {
            setSpotifyUser({
              id: 'connected',
              display_name: 'Spotify User (Connected)',
              email: undefined,
              images: undefined,
            });
          }
        } else {
          setIsConnected(false);
          setSpotifyUser(null);
        }
      } catch {
        setIsConnected(false);
        setSpotifyUser(null);
      }
    };

    checkConnection();
  }, []);

  const connectToSpotify = async (serviceId: number) => {
    try {
      setIsConnecting(true);

      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const origin = window.location.origin.replace('localhost', '127.0.0.1');
      const redirectUri = `${origin}/service/callback`;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      const scope = encodeURIComponent(
        'user-read-email user-read-private playlist-modify-public playlist-modify-private user-modify-playback-state',
      );
      const state = encodeURIComponent('spotify:service_link');

      if (!clientId) {
        throw new Error('Spotify OAuth2 not configured');
      }

      const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}`;

      let popup: Window | null = null;

      const messageListener = async (event: MessageEvent) => {
        const validOrigins = ['http://localhost:8081', 'http://127.0.0.1:8081'];

        if (!validOrigins.includes(event.origin)) {
          return;
        }

        if (event.data.type === 'SPOTIFY_OAUTH_SUCCESS' && event.data.code) {
          try {
            await servicesApi.linkService(serviceId, event.data.code);
            setIsConnected(true);

            try {
              const profile = await servicesApi.getSpotifyProfile();
              setSpotifyUser(profile);
            } catch {
              setSpotifyUser({
                id: 'connected',
                display_name: 'Spotify User (Connected)',
                email: undefined,
                images: undefined,
              });
            }
          } catch (linkError) {
            setIsConnected(false);
            throw linkError;
          }

          if (popup && !popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
        } else if (event.data.type === 'SPOTIFY_OAUTH_ERROR') {
          if (popup && !popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
          throw new Error(event.data.error || 'Failed to connect Spotify');
        }
      };

      window.addEventListener('message', messageListener);

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      popup = window.open(
        spotifyAuthUrl,
        'SpotifyAuth',
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

  const disconnectSpotify = async () => {
    await servicesApi.disconnectService('spotify');
    setIsConnected(false);
    setSpotifyUser(null);
  };

  return {
    isConnecting,
    isConnected,
    spotifyUser,
    connectToSpotify,
    disconnectSpotify,
  };
};
