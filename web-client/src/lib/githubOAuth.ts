const GITHUB_CLIENT_ID =
  import.meta.env.VITE_GITHUB_CLIENT_ID || '';

const REDIRECT_URI =
  import.meta.env.VITE_GITHUB_REDIRECT_URI ||
  'http://localhost:8081/service/callback';

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';

export interface GitHubOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
}

export function getGitHubAuthUrl(
  intent: 'login' | 'register' = 'login',
): string {
  const config: GitHubOAuthConfig = {
    clientId: GITHUB_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scope: 'read:user user:email',
    responseType: 'code',
  };

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state: `github:${intent}`,
  });

  return `${GITHUB_AUTH_URL}?${params.toString()}`;
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
  if (parts.length === 2 && parts[0] === 'github') {
    return parts[1] === 'register' ? 'register' : 'login';
  }
  return 'login';
}

export function initiateGitHubOAuth(
  intent: 'login' | 'register' = 'login',
): void {
  const authUrl = getGitHubAuthUrl(intent);
  window.location.href = authUrl;
}

export const githubOAuth = {
  getAuthUrl: getGitHubAuthUrl,
  extractCodeFromUrl,
  extractErrorFromUrl,
  extractIntentFromUrl,
  initiate: initiateGitHubOAuth,
  clientId: GITHUB_CLIENT_ID,
  redirectUri: REDIRECT_URI,
};
