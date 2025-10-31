import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesApi } from '../../services/api';

interface ConnectedService {
  id: number;
  name: string;
  displayName: string;
  icon: string | React.ReactNode;
  user?: {
    id: string;
    username: string;
    email?: string;
    avatar?: string;
    discriminator?: string;
  };
  connectedAt: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [connectedServices, setConnectedServices] = useState<
    ConnectedService[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConnectedServices();
  }, []);

  const loadConnectedServices = async () => {
    try {
      setLoading(true);
      const services: ConnectedService[] = [];

      // First, get the list of services the user has connected
      const userServices = await servicesApi.getUserServices();
      const connectedServiceNames = new Set(
        userServices.map((s) => s.name.toLowerCase()),
      );

      if (connectedServiceNames.has('discord')) {
        try {
          const discordProfile = await servicesApi.getDiscordProfile();
          services.push({
            id: 1,
            name: 'discord',
            displayName: 'Discord',
            icon: (
              <svg
                width="32"
                height="32"
                viewBox="0 0 127.14 96.36"
                className="w-8 h-8"
              >
                <path
                  fill="#5865f2"
                  d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                />
              </svg>
            ),
            user: discordProfile
              ? {
                  ...discordProfile,
                  avatar: discordProfile.avatar ?? undefined,
                }
              : undefined,
            connectedAt: new Date().toISOString(),
          });
        } catch {
          // Discord not connected
        }
      }

      if (connectedServiceNames.has('github')) {
        try {
          const githubProfile = await servicesApi.getGitHubProfile();
          services.push({
            id: 2,
            name: 'github',
            displayName: 'GitHub',
            icon: (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                className="w-8 h-8"
                fill="#24292e"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            ),
            user: githubProfile
              ? {
                  id: githubProfile.id,
                  username: githubProfile.login,
                  email: githubProfile.email,
                  avatar: githubProfile.avatar_url ?? undefined,
                }
              : undefined,
            connectedAt: new Date().toISOString(),
          });
        } catch {
          // GitHub not connected
        }
      }

      if (connectedServiceNames.has('twitch')) {
        try {
          const twitchProfile = await servicesApi.getTwitchProfile();
          services.push({
            id: 3,
            name: 'twitch',
            displayName: 'Twitch',
            icon: (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                className="w-8 h-8"
                fill="#9146FF"
              >
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
            ),
            user: twitchProfile
              ? {
                  id: twitchProfile.id,
                  username: twitchProfile.login,
                  email: twitchProfile.email,
                  avatar: twitchProfile.profile_image_url ?? undefined,
                }
              : undefined,
            connectedAt: new Date().toISOString(),
          });
        } catch {
          // Twitch not connected
        }
      }

      if (connectedServiceNames.has('gmail')) {
        try {
          const gmailProfile = await servicesApi.getGmailProfile();
          services.push({
            id: 4,
            name: 'gmail',
            displayName: 'Gmail',
            icon: (
              <svg width="32" height="32" viewBox="0 0 24 24" className="w-8 h-8">
                <path
                  fill="#EA4335"
                  d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.910 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
                />
              </svg>
            ),
            user: gmailProfile
              ? {
                  id: gmailProfile.id,
                  username: gmailProfile.name || gmailProfile.email,
                  email: gmailProfile.email,
                  avatar: gmailProfile.picture ?? undefined,
                }
              : undefined,
            connectedAt: new Date().toISOString(),
          });
        } catch {
          // Gmail not connected
        }
      }

      if (connectedServiceNames.has('reddit')) {
        try {
          const redditProfile = await servicesApi.getRedditProfile();
          services.push({
            id: 5,
            name: 'reddit',
            displayName: 'Reddit',
            icon: (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                className="w-8 h-8"
                fill="#FF4500"
              >
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
            ),
            user: redditProfile
              ? {
                  id: redditProfile.id,
                  username: redditProfile.name || 'Reddit User',
                  email: undefined,
                  avatar: redditProfile.icon_img ?? undefined,
                }
              : undefined,
            connectedAt: new Date().toISOString(),
          });
        } catch {
          // Reddit not connected
        }
      }

      if (connectedServiceNames.has('spotify')) {
        try {
          const spotifyProfile = await servicesApi.getSpotifyProfile();
          services.push({
            id: 6,
            name: 'spotify',
            displayName: 'Spotify',
            icon: (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                className="w-8 h-8"
                fill="#1DB954"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            ),
            user: spotifyProfile
              ? {
                  id: spotifyProfile.id,
                  username:
                    spotifyProfile.display_name ||
                    spotifyProfile.email ||
                    'Spotify User',
                  email: spotifyProfile.email || undefined,
                  avatar:
                    spotifyProfile.images && spotifyProfile.images.length > 0
                      ? spotifyProfile.images[0].url
                      : undefined,
                }
              : undefined,
            connectedAt: new Date().toISOString(),
          });
        } catch {
          // Spotify not connected
        }
      }

      setConnectedServices(services);
    } catch {
      setError('Failed to load connected services');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectService = async (serviceName: string) => {
    try {
      setError(null);
      setSuccessMessage(null);

      await servicesApi.disconnectService(serviceName);
      const service = connectedServices.find((s) => s.name === serviceName);
      const displayName = service?.displayName || serviceName;
      setSuccessMessage(`Successfully disconnected from ${displayName}`);

      await loadConnectedServices();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to disconnect from ${serviceName}`;
      setError(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center text-gray-100 hover:text-white transition-colors"
                aria-label="Back to Areas"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Areas
              </button>
            </div>
            <h1 className="text-3xl font-bold text-white">Profile</h1>
            <div className="w-24" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900 bg-opacity-50 border border-green-500 rounded-lg text-green-200">
            {successMessage}
          </div>
        )}

        <div className="bg-gray-700 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Connected Services
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-200">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>
                {connectedServices.length} service
                {connectedServices.length !== 1 ? 's' : ''} connected
              </span>
            </div>
          </div>
          {connectedServices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-200 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-100 mb-2">
                No services connected
              </h3>
              <p className="text-gray-200 mb-6">
                Connect external services to unlock more automation
                possibilities for your AREAs.
              </p>
              <button
                onClick={() => navigate('/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
                aria-label="Create Your First AREA"
              >
                Create Your First AREA
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-gray-600 rounded-lg p-6 border border-gray-500 hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-lg">
                        {typeof service.icon === 'string' ? (
                          <span className="text-2xl">{service.icon}</span>
                        ) : (
                          service.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {service.displayName}
                        </h3>
                        {service.user && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              {service.user.avatar && (
                                <img
                                  src={service.user.avatar}
                                  alt="User Avatar"
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <div>
                                <span className="text-base font-medium text-gray-100">
                                  {service.user.discriminator &&
                                  service.user.discriminator !== '0' &&
                                  service.user.discriminator !== '0000'
                                    ? `#${service.user.discriminator} ${service.user.username}`
                                    : service.user.username}
                                </span>
                                {service.user.email && (
                                  <p className="text-sm text-gray-200">
                                    {service.user.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-300">
                              Connected on {formatDate(service.connectedAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <button
                        onClick={() => handleDisconnectService(service.name)}
                        className="bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium py-2 px-4 border border-red-500 hover:border-red-600 rounded-lg"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-6 bg-gray-600 bg-opacity-70 rounded-lg border border-gray-500">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">
                  Connect More Services
                </h3>
                <p className="text-sm text-gray-200">
                  Expand your automation possibilities by connecting additional
                  external services when creating new AREAs.
                </p>
              </div>
              <button
                onClick={() => navigate('/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                aria-label="Create New AREA"
              >
                Create New AREA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
