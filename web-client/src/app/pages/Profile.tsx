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

      // Check Discord connection
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
        console.log('Discord not connected');
      }

      setConnectedServices(services);
    } catch (error) {
      console.error('Failed to load connected services:', error);
      setError('Failed to load connected services');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectService = async (serviceName: string) => {
    try {
      setError(null);
      setSuccessMessage(null);

      const serviceNameLower = serviceName.toLowerCase();

      await servicesApi.disconnectService(serviceNameLower);
      setSuccessMessage(`Successfully disconnected from ${serviceName}`);

      await loadConnectedServices();
    } catch (error) {
      console.error(`Failed to disconnect from ${serviceName}:`, error);
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
                        onClick={() =>
                          handleDisconnectService(service.displayName)
                        }
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
