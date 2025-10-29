const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID || '';

const REDIRECT_URI =
  import.meta.env.VITE_TWITCH_REDIRECT_URI ||
  'http://localhost:8081/service/callback';

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';

export interface TwitchOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
}

export function getTwitchAuthUrl(
  intent: 'login' | 'register' = 'login',
): string {
  const config: TwitchOAuthConfig = {
    clientId: TWITCH_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scope: 'user:read:email chat:read chat:edit',
    responseType: 'code',
  };

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: config.responseType,
    scope: config.scope,
    state: `twitch:${intent}`,
  });

  return `${TWITCH_AUTH_URL}?${params.toString()}`;
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
  if (parts.length === 2 && parts[0] === 'twitch') {
    return parts[1] === 'register' ? 'register' : 'login';
  }
  return 'login';
}

export function initiateTwitchOAuth(
  intent: 'login' | 'register' = 'login',
): void {
  const authUrl = getTwitchAuthUrl(intent);
  window.location.href = authUrl;
}

export const twitchOAuth = {
  getAuthUrl: getTwitchAuthUrl,
  extractCodeFromUrl,
  extractErrorFromUrl,
  extractIntentFromUrl,
  initiate: initiateTwitchOAuth,
  clientId: TWITCH_CLIENT_ID,
  redirectUri: REDIRECT_URI,
};
