const TRELLO_API_KEY = import.meta.env.VITE_TRELLO_API_KEY || '';

const TRELLO_AUTH_URL = 'https://trello.com/1/authorize';

export interface TrelloOAuthConfig {
  apiKey: string;
  name: string;
  expiration: string;
  scope: string;
  responseType: string;
  returnUrl: string;
}

export function getTrelloAuthUrl(): string {
  const appName = 'AREA App Integration';
  const returnUrl = `${window.location.origin}/service/callback?state=trello:service_link`;

  const config: TrelloOAuthConfig = {
    apiKey: TRELLO_API_KEY,
    name: appName,
    expiration: 'never',
    scope: 'read,write',
    responseType: 'token',
    returnUrl: returnUrl,
  };

  const params = new URLSearchParams({
    key: config.apiKey,
    name: config.name,
    expiration: config.expiration,
    scope: config.scope,
    response_type: config.responseType,
    return_url: config.returnUrl,
  });

  return `${TRELLO_AUTH_URL}?${params.toString()}`;
}

export function extractTokenFromUrl(
  url: string = window.location.href,
): string | null {
  const hash = url.includes('#') ? url.split('#')[1] : '';
  if (!hash) return null;

  const tokenMatch = hash.match(/[#&]?token=([^&]*)/);
  return tokenMatch && tokenMatch[1] ? tokenMatch[1] : null;
}

export function extractErrorFromUrl(
  url: string = window.location.href,
): string | null {
  const urlObj = new URL(url);
  return urlObj.searchParams.get('error');
}

export function initiateTrelloOAuth(): void {
  const authUrl = getTrelloAuthUrl();
  window.location.href = authUrl;
}

export const trelloOAuth = {
  getAuthUrl: getTrelloAuthUrl,
  extractTokenFromUrl,
  extractErrorFromUrl,
  initiate: initiateTrelloOAuth,
  apiKey: TRELLO_API_KEY,
};
