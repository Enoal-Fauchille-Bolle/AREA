import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, tokenService } from '../../services/api';
import { googleOAuth } from '../../lib/googleOAuth';
import { githubOAuth } from '../../lib/githubOAuth';
import { discordOAuth } from '../../lib/discordOAuth';
import { twitchOAuth } from '../../lib/twitchOAuth';
import { gmailOAuth } from '../../lib/gmailOAuth';

function ServiceCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const hasHandledRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasHandledRef.current) {
        return;
      }
      hasHandledRef.current = true;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');

      if (window.opener) {
        let service = 'UNKNOWN';
        if (state?.includes('discord')) {
          service = 'DISCORD';
        } else if (state?.includes('github')) {
          service = 'GITHUB';
        } else if (state?.includes('twitch')) {
          service = 'TWITCH';
        } else if (state?.includes('gmail')) {
          service = 'GMAIL';
        } else if (state?.includes('google')) {
          service = 'GOOGLE';
        } else {
          service = 'DISCORD';
        }

        let message;
        if (error) {
          message = {
            type: `${service}_OAUTH_ERROR`,
            error: error,
          };
        } else if (code) {
          message = {
            type: `${service}_OAUTH_SUCCESS`,
            code: code,
          };
        } else {
          message = {
            type: `${service}_OAUTH_ERROR`,
            error: 'No authorization code received',
          };
        }

        window.opener.postMessage(message, window.location.origin);
        setTimeout(() => {
          window.close();
        }, 1000);
        return;
      }

      try {
        if (!code) {
          throw new Error('No authorization code received from OAuth provider');
        }

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        let provider: 'google' | 'github' | 'discord' | 'twitch' | 'gmail';
        let intent: 'login' | 'register';
        let redirectUri: string;

        if (state?.startsWith('google:')) {
          provider = 'google';
          intent = googleOAuth.extractIntentFromUrl();
          redirectUri = googleOAuth.redirectUri;
        } else if (state?.startsWith('gmail:')) {
          provider = 'gmail';
          intent = 'login';
          redirectUri = gmailOAuth.redirectUri;
        } else if (state?.startsWith('github:')) {
          provider = 'github';
          intent = githubOAuth.extractIntentFromUrl();
          redirectUri = githubOAuth.redirectUri;
        } else if (state?.startsWith('discord:')) {
          provider = 'discord';
          intent = discordOAuth.extractIntentFromUrl();
          redirectUri = discordOAuth.redirectUri;
        } else if (state?.startsWith('twitch:')) {
          provider = 'twitch';
          intent = twitchOAuth.extractIntentFromUrl();
          redirectUri = twitchOAuth.redirectUri;
        } else {
          throw new Error(`Unknown OAuth provider from state: ${state}`);
        }

        const response =
          intent === 'register'
            ? await authApi.registerWithOAuth2({
                provider,
                code: code,
                redirect_uri: redirectUri,
              })
            : await authApi.loginWithOAuth2({
                provider,
                code: code,
                redirect_uri: redirectUri,
              });

        tokenService.setToken(response.token);
        if (!tokenService.getToken()) {
          throw new Error('Failed to save authentication token');
        }
        setStatus('success');

        setTimeout(() => {
          navigate('/profile', { replace: true });
        }, 1500);
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred',
        );

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-12 shadow-2xl max-w-md w-full mx-4">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-black text-black mb-2">
              {window.opener
                ? 'Processing authentication...'
                : 'Authenticating...'}
            </h2>
            <p className="text-gray-600">
              {window.opener
                ? 'This window will close automatically'
                : 'Please wait while we sign you in'}
            </p>
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
