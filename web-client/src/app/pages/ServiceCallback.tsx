import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, tokenService } from '../../services/api';
import { googleOAuth } from '../../lib/googleOAuth';

function ServiceCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Check for error in URL
        const error = googleOAuth.extractErrorFromUrl();
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        // Extract authorization code from URL
        const code = googleOAuth.extractCodeFromUrl();
        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        console.log('Received authorization code, exchanging for token...');
        console.log('Sending to backend:', {
          service: 'google',
          code: code.substring(0, 20) + '...',
          redirect_uri: googleOAuth.redirectUri,
        });

        // Exchange code for token via backend
        const response = await authApi.loginWithOAuth2({
          service: 'google',
          code: code,
          redirect_uri: googleOAuth.redirectUri,
        });

        console.log('Received token from backend:', !!response.token);

        // Store token
        tokenService.setToken(response.token);
        setStatus('success');

        // Redirect to profile after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred',
        );

        // Redirect to login after error display
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-12 shadow-2xl max-w-md w-full mx-4">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-black text-black mb-2">
              Authenticating with Google...
            </h2>
            <p className="text-gray-600">Please wait while we sign you in</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-black mb-2">
              Successfully Authenticated!
            </h2>
            <p className="text-gray-600">Redirecting to your profile...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-black mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceCallback;
