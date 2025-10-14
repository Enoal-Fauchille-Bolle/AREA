import React, { useEffect } from 'react';

const DiscordOAuthCallback: React.FC = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      window.opener?.postMessage(
        {
          type: 'DISCORD_OAUTH_ERROR',
          error: error,
        },
        window.location.origin
      );
    } else if (code) {
      window.opener?.postMessage(
        {
          type: 'DISCORD_OAUTH_SUCCESS',
          code: code,
        },
        window.location.origin
      );
    } else {
      window.opener?.postMessage(
        {
          type: 'DISCORD_OAUTH_ERROR',
          error: 'No authorization code received',
        },
        window.location.origin
      );
    }

    window.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Processing Discord authentication...</p>
      </div>
    </div>
  );
};

export default DiscordOAuthCallback;