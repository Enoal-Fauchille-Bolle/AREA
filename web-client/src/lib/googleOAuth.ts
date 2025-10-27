// Google OAuth2 Configuration
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1076037701323-knvel0vbrhlmtam76q6apr753enaiooj.apps.googleusercontent.com';

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

/**
 * Generate the Google OAuth2 authorization URL
 */
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
    state: intent,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Extract the authorization code from the URL query parameters
 */
export function extractCodeFromUrl(
  url: string = window.location.href,
): string | null {
  const urlObj = new URL(url);
  return urlObj.searchParams.get('code');
}

/**
 * Extract error from the URL query parameters (if OAuth failed)
 */
export function extractErrorFromUrl(
  url: string = window.location.href,
): string | null {
  const urlObj = new URL(url);
  return urlObj.searchParams.get('error');
}

/**
 * Extract the intent (login or register) from the URL state parameter
 */
export function extractIntentFromUrl(
  url: string = window.location.href,
): 'login' | 'register' {
  const urlObj = new URL(url);
  const state = urlObj.searchParams.get('state');
  return state === 'register' ? 'register' : 'login';
}

/**
 * Initiate Google OAuth2 flow by redirecting to Google's authorization page
 */
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
