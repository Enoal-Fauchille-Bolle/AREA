import type { Area } from '../services/api';

interface AreaCardProps {
  area: Area;
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export const AreaCard = ({
  area,
  onToggleStatus,
  onDelete,
  onEdit,
}: AreaCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getAreaIcon = (name: string) => {
    const icons = {
      discord: '💬',
      youtube: '▶️',
      twitch: '🟣',
      gmail: '📧',
      clock: '🕐',
      reddit: '🤖',
      google: '🔍',
      spotify: '🟢',
      email: '✉️',
    };

    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return '⚡';
  };

  const getServiceIcon = (serviceName?: string) => {
    if (!serviceName) return null;
    const name = serviceName.toLowerCase();
    if (name === 'clock') {
      return (
        <svg
          className="w-5 h-5 text-blue-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (name === 'email') {
      return (
        <svg
          className="w-5 h-5 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    }
    const logoUrls: { [key: string]: string } = {
      discord: 'https://cdn.simpleicons.org/discord/5865F2',
      youtube: 'https://cdn.simpleicons.org/youtube/FF0000',
      twitch: 'https://cdn.simpleicons.org/twitch/9146FF',
      gmail: 'https://cdn.simpleicons.org/gmail/EA4335',
      reddit: 'https://cdn.simpleicons.org/reddit/FF4500',
      google: 'https://cdn.simpleicons.org/google/4285F4',
      spotify: 'https://cdn.simpleicons.org/spotify/1DB954',
      github: 'https://cdn.simpleicons.org/github/181717',
    };

    const logoUrl = logoUrls[name];
    if (logoUrl) {
      return <img src={logoUrl} alt={serviceName} className="w-5 h-5" />;
    }
    return null;
  };

  return (
    <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getAreaIcon(area.name)}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{area.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${getStatusColor(area.is_active)}`}
              ></span>
              <span className="text-sm text-gray-200">
                {getStatusText(area.is_active)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(area.id)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Edit area"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onToggleStatus(area.id)}
            className={`p-2 rounded-lg transition-colors ${
              area.is_active
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title={area.is_active ? 'Pause area' : 'Activate area'}
          >
            {area.is_active ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => onDelete(area.id)}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            title="Delete area"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {area.description && (
        <p className="text-gray-100 text-sm mb-4 line-clamp-2">
          {area.description}
        </p>
      )}

      <div className="mb-4 space-y-3">
        {area.componentAction && (
          <div className="bg-gray-800/80 rounded-lg p-3 border border-gray-600/50">
            <div className="flex items-start space-x-2">
              <span className="text-blue-400 text-sm font-semibold mt-0.5">
                IF
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  {getServiceIcon(area.componentAction.service?.name)}
                  <span className="text-sm font-medium text-gray-100">
                    {area.componentAction.service?.name || 'Service'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-200 truncate">
                    {area.componentAction.name}
                  </span>
                </div>
                {area.componentAction.description && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-1">
                    {area.componentAction.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {area.componentReaction && (
          <div className="bg-gray-800/80 rounded-lg p-3 border border-gray-600/50">
            <div className="flex items-start space-x-2">
              <span className="text-green-400 text-sm font-semibold mt-0.5">
                THEN
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  {getServiceIcon(area.componentReaction.service?.name)}
                  <span className="text-sm font-medium text-gray-100">
                    {area.componentReaction.service?.name || 'Service'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-200 truncate">
                    {area.componentReaction.name}
                  </span>
                </div>
                {area.componentReaction.description && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-1">
                    {area.componentReaction.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-200">
        <div className="flex items-center space-x-4">
          <span>Triggered: {area.triggered_count} times</span>
          {area.last_triggered_at && (
            <span>Last: {formatDate(area.last_triggered_at)}</span>
          )}
        </div>
        <span>Created: {formatDate(area.created_at)}</span>
      </div>
    </div>
  );
};

export default AreaCard;
