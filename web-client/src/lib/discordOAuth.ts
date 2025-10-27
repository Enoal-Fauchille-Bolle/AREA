const DISCORD_CLIENT_ID =
  import.meta.env.VITE_DISCORD_CLIENT_ID || '';

const REDIRECT_URI =
  import.meta.env.VITE_DISCORD_REDIRECT_URI ||
  'http://localhost:8081/service/callback';

const DISCORD_AUTH_URL = 'https://discord.com/oauth2/authorize';

export interface DiscordOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
}

export function getDiscordAuthUrl(
  intent: 'login' | 'register' = 'login',
): string {
  const config: DiscordOAuthConfig = {
    clientId: DISCORD_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scope: 'identify email',
    responseType: 'code',
  };

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: config.responseType,
    scope: config.scope,
    state: `discord:${intent}`,
  });

  return `${DISCORD_AUTH_URL}?${params.toString()}`;
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
  if (parts.length === 2 && parts[0] === 'discord') {
    return parts[1] === 'register' ? 'register' : 'login';
  }
  return 'login';
}

export function initiateDiscordOAuth(
  intent: 'login' | 'register' = 'login',
): void {
  const authUrl = getDiscordAuthUrl(intent);
  window.location.href = authUrl;
}

export const discordOAuth = {
  getAuthUrl: getDiscordAuthUrl,
  extractCodeFromUrl,
  extractErrorFromUrl,
  extractIntentFromUrl,
  initiate: initiateDiscordOAuth,
  clientId: DISCORD_CLIENT_ID,
  redirectUri: REDIRECT_URI,
};
