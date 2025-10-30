const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const REDIRECT_URI =
  import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
  'http://localhost:8081/service/callback';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  accessType: string;
  prompt: string;
}

export function getGoogleAuthUrl(
  intent: 'login' | 'register' = 'login',
): string {
  const config: GoogleOAuthConfig = {
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scope: 'openid email profile',
    responseType: 'code',
    accessType: 'offline',
    prompt: 'consent',
  };

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: config.responseType,
    scope: config.scope,
    access_type: config.accessType,
    prompt: config.prompt,
    state: `google:${intent}`,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function extractCodeFromUrl(
  url: string = window.location.href,
): string | null {
  const urlObj = new URL(url);
  return urlObj.searchParams.get('code');
}

export function extractErrorFromUrl(
  url: string = window.location.href,
): string | null {
  const urlObj = new URL(url);
  return urlObj.searchParams.get('error');
}

export function extractIntentFromUrl(
  url: string = window.location.href,
): 'login' | 'register' {
  const urlObj = new URL(url);
  const state = urlObj.searchParams.get('state');
  if (!state) return 'login';
  const parts = state.split(':');
  if (parts.length === 2 && parts[0] === 'google') {
    return parts[1] === 'register' ? 'register' : 'login';
  }
  return 'login';
}

export function initiateGoogleOAuth(
  intent: 'login' | 'register' = 'login',
): void {
  const authUrl = getGoogleAuthUrl(intent);
  window.location.href = authUrl;
}

export const googleOAuth = {
  getAuthUrl: getGoogleAuthUrl,
  extractCodeFromUrl,
  extractErrorFromUrl,
  extractIntentFromUrl,
  initiate: initiateGoogleOAuth,
  clientId: GOOGLE_CLIENT_ID,
  redirectUri: REDIRECT_URI,
};
