import type { Area } from '../services/api';

interface AreaCardProps {
  area: Area;
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
}

export const AreaCard = ({ area, onToggleStatus, onDelete }: AreaCardProps) => {
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
      weather: '🌤️',
      email: '📧',
      discord: '💬',
      stock: '📈',
      social: '💾',
      home: '🏠',
      calendar: '📅',
      notification: '🔔',
      automation: '⚙️',
      backup: '💾',
    };

    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return '⚡';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getAreaIcon(area.name)}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{area.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${getStatusColor(area.is_active)}`}
              ></span>
              <span className="text-sm text-gray-400">
                {getStatusText(area.is_active)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
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
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {area.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-400">
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
