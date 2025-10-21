import React, { useEffect } from 'react';

const ServiceCallback: React.FC = () => {
  useEffect(() => {
    console.log('=== ServiceCallback mounted ===');
    console.log('Full URL:', window.location.href);
    console.log('Window opener exists:', !!window.opener);
    console.log('Window origin:', window.location.origin);

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    console.log('OAuth params:', {
      code: code ? `${code.substring(0, 10)}...` : null,
      error,
    });

    const service = 'DISCORD';

    if (!window.opener) {
      console.error(
        'ERROR: window.opener is null! Cannot send message to parent.',
      );
      alert('Error: Parent window not found. Please try again.');
      return;
    }

    let message;
    if (error) {
      console.log('Sending OAuth error to opener');
      message = {
        type: `${service}_OAUTH_ERROR`,
        error: error,
      };
    } else if (code) {
      console.log('Sending OAuth success to opener with code');
      message = {
        type: `${service}_OAUTH_SUCCESS`,
        code: code,
      };
    } else {
      console.log('No code or error found, sending error');
      message = {
        type: `${service}_OAUTH_ERROR`,
        error: 'No authorization code received',
      };
    }

    console.log('Posting message:', message);
    window.opener.postMessage(message, window.location.origin);
    console.log('Message posted successfully');

    setTimeout(() => {
      console.log('Closing popup window');
      window.close();
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Processing authentication...</p>
        <p className="text-gray-400 text-sm mt-2">
          This window will close automatically
        </p>
      </div>
    </div>
  );
};

export default ServiceCallback;
