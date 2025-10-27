import { Response } from 'express';
import { type OAuthProvider } from './dto';
import { ConfigService } from '@nestjs/config';

export function isMobileRequest(userAgent: string): boolean {
  // Detect mobile from User-Agent
  if (!userAgent) {
    return false;
  }

  const mobilePatterns = [
    /Android/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];

  return mobilePatterns.some((pattern) => pattern.test(userAgent));
}

export function handleMobileCallback(
  res: Response,
  provider: OAuthProvider,
  code: string,
  callbackContext: 'auth' | 'service',
  configService: ConfigService,
) {
  const appService = configService.get('app');

  // Get custom URL scheme from config
  const appScheme =
    callbackContext === 'auth'
      ? appService.oauth2.auth.mobile_scheme
      : appService.oauth2.service.mobile_scheme;

  // Build deep link URL that the native app will intercept
  const deepLinkUrl = `${appScheme}?code=${encodeURIComponent(
    code,
  )}&provider=${provider}`;

  // Return HTML page that redirects to the app
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirecting to App...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 2rem auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .message {
            font-size: 1.25rem;
            margin: 1rem 0;
        }
        .fallback {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        .fallback-link {
            color: white;
            text-decoration: underline;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <div class="message">Redirecting to app...</div>
        <div class="fallback">
            <p>If you're not redirected automatically:</p>
            <a href="${deepLinkUrl}" class="fallback-link">Click here to open the app</a>
        </div>
    </div>
    <script>
        // Attempt to redirect to the app
        window.location.href = '${deepLinkUrl}';

        // Fallback: If still on this page after 3 seconds, show manual link
        setTimeout(() => {
            document.querySelector('.message').textContent = 'Having trouble opening the app?';
        }, 3000);

        // Alternative: Post message to React Native WebView
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'oauth_callback',
                code: '${code}',
                provider: '${provider}'
            }));
        }
    </script>
</body>
</html>`;

  return res.status(200).contentType('text/html').send(html);
}
