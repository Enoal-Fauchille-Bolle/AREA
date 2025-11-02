const REDDIT_CLIENT_ID = import.meta.env.VITE_REDDIT_CLIENT_ID || '';

const REDIRECT_URI =
  import.meta.env.VITE_REDDIT_REDIRECT_URI ||
  'http://localhost:8080/reddit/callback';

const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize';

export interface RedditOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  duration: string;
}

export function getRedditAuthUrl(): string {
  const config: RedditOAuthConfig = {
    clientId: REDDIT_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scope: 'identity submit read',
    responseType: 'code',
    duration: 'permanent',
  };

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: config.responseType,
    scope: config.scope,
    duration: config.duration,
    state: 'web:service',
  });

  return `${REDDIT_AUTH_URL}?${params.toString()}`;
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

export function initiateRedditOAuth(): void {
  const authUrl = getRedditAuthUrl();
  window.location.href = authUrl;
}

export const redditOAuth = {
  getAuthUrl: getRedditAuthUrl,
  extractCodeFromUrl,
  extractErrorFromUrl,
  initiate: initiateRedditOAuth,
  clientId: REDDIT_CLIENT_ID,
  redirectUri: REDIRECT_URI,
};
