const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID || '';

const REDIRECT_URI =
  import.meta.env.VITE_GMAIL_REDIRECT_URI ||
  'http://localhost:8081/service/callback';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export interface GmailOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  accessType: string;
  prompt: string;
}

export function getGmailAuthUrl(): string {
  const config: GmailOAuthConfig = {
    clientId: GMAIL_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scope: 'https://www.googleapis.com/auth/gmail.modify openid email profile',
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
    state: 'gmail:service_link',
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

export function initiateGmailOAuth(): void {
  const authUrl = getGmailAuthUrl();
  window.location.href = authUrl;
}

export const gmailOAuth = {
  getAuthUrl: getGmailAuthUrl,
  extractCodeFromUrl,
  extractErrorFromUrl,
  initiate: initiateGmailOAuth,
  clientId: GMAIL_CLIENT_ID,
  redirectUri: REDIRECT_URI,
};
