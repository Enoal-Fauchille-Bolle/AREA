# AREA Mobile Client

Flutter-based mobile application for the AREA project (Action-Reaction Automation platform). This app allows users to create automations by connecting various services and defining triggers and actions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation on Fedora](#installation-on-fedora)
- [Project Setup](#project-setup)
- [Running the Application](#running-the-application)
- [Network Configuration](#network-configuration)
- [OAuth Configuration](#oauth-configuration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- **Fedora Linux** (or compatible Linux distribution)
- **Git** for version control
- **Android device** or **Android emulator** for testing
- Internet connection for downloading dependencies

## Installation on Fedora

### 1. Install Flutter

#### a. Install Required Dependencies

```bash
# Update system packages
sudo dnf update -y

# Install development tools and libraries
sudo dnf install -y cmake ninja-build gcc-c++ clang clang++ gtk3-devel
sudo dnf install -y pkg-config glib2-devel cairo-devel pango-devel gdk-pixbuf2-devel atk-devel
sudo dnf install -y git curl unzip xz
```

#### b. Download and Install Flutter SDK

```bash
# Navigate to your home directory
cd ~

# Download Flutter (check for latest version at https://flutter.dev/docs/get-started/install/linux)
wget https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.24.0-stable.tar.xz

# Extract Flutter
tar xf flutter_linux_3.24.0-stable.tar.xz

# Add Flutter to PATH (add this line to ~/.bashrc or ~/.zshrc)
echo 'export PATH="$HOME/flutter/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
flutter --version
```

#### c. Run Flutter Doctor

```bash
# Check for any missing dependencies
flutter doctor

# Accept Android licenses (if prompted)
flutter doctor --android-licenses
```

### 2. Install ADB (Android Debug Bridge)

#### Option A: Install via DNF

```bash
# Install Android tools package
sudo dnf install -y android-tools

# Verify ADB installation
adb --version
```

#### Option B: Install via Android SDK

If you need the full Android SDK:

```bash
# Download Android Command Line Tools from https://developer.android.com/studio#command-tools
cd ~
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip

# Create directory and extract
mkdir -p ~/Android/cmdline-tools
unzip commandlinetools-linux-9477386_latest.zip -d ~/Android/cmdline-tools
mv ~/Android/cmdline-tools/cmdline-tools ~/Android/cmdline-tools/latest

# Add to PATH
echo 'export ANDROID_HOME="$HOME/Android"' >> ~/.bashrc
echo 'export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Install platform tools (includes ADB)
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

### 3. Enable USB Debugging on Android Device

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times to enable Developer Options
3. Go to **Settings** → **System** → **Developer Options**
4. Enable **USB Debugging**
5. Connect device via USB and accept debugging authorization prompt

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AREA/mobile-client
```

### 2. Install Flutter Dependencies

```bash
flutter pub get
```

### 3. Configure Environment Variables

Create or edit the `.env` file in the `mobile-client` directory:

```bash
# Server Configuration
URL_BASE='http://localhost'
PORT=8080

# OAuth Client IDs
DISCORD_CLIENT_ID=your_discord_client_id
GITHUB_CLIENT_ID=your_github_client_id
GOOGLE_CLIENT_ID=your_google_client_id
TWITCH_CLIENT_ID=your_twitch_client_id
YOUTUBE_CLIENT_ID=your_youtube_client_id
GMAIL_CLIENT_ID=your_gmail_client_id
```

**Important**: Replace the placeholder values with actual OAuth client IDs from your provider consoles.

## Running the Application

### 1. Check Connected Devices

```bash
# List all connected devices/emulators
flutter devices
```

### 2. Launch the App

```bash
# Run on the default device
flutter run

# Run on a specific device
flutter run -d <device_id>

# Run in release mode (optimized)
flutter run --release

# Run with verbose logging
flutter run -v
```

### 3. Hot Reload During Development

While the app is running:
- Press **`r`** in the terminal to hot reload
- Press **`R`** to hot restart
- Press **`q`** to quit

## Network Configuration

### Using ADB Reverse (Recommended for Development)

When developing with a physical Android device and a local backend server, use `adb reverse` to forward localhost traffic:

```bash
# Forward device localhost:8080 to computer localhost:8080
adb reverse tcp:8080 tcp:8080

# Verify the reverse port forwarding
adb reverse --list

# Remove reverse port forwarding when done
adb reverse --remove tcp:8080

# Remove all reverse port forwardings
adb reverse --remove-all
```

**How it works**: When your Android device makes a request to `http://localhost:8080`, it will be forwarded to your computer's `localhost:8080` where the backend server is running.

### Using Android Emulator

If using the Android Emulator, you can access the host machine using the special IP:

**Option 1**: Use the emulator's special IP address `10.0.2.2`:
- In the app's **Settings** page, set:
  - Base URL: `http://10.0.2.2`
  - Port: `8080`

**Option 2**: Use `adb reverse` (same as physical device)

### Using Physical Device with Machine IP

If `adb reverse` doesn't work or you prefer direct connection:

1. Find your computer's local IP address:
```bash
# On Fedora
ip addr show | grep "inet " | grep -v 127.0.0.1
```

2. In the app's **Settings** page:
   - Base URL: `http://YOUR_MACHINE_IP` (e.g., `http://192.168.1.100`)
   - Port: `8080`

3. Ensure your firewall allows connections:
```bash
# Temporarily allow port 8080
sudo firewall-cmd --add-port=8080/tcp

# Make it permanent
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### Runtime Configuration

The app uses a **RuntimeConfig** system that allows changing the server URL without recompiling:

1. Open the app
2. Navigate to **Settings** (gear icon on home page)
3. Update **Base URL** and **Port**
4. Tap **Save Configuration**

The app will remember your settings across restarts.

## OAuth Configuration

### Configuring OAuth Providers

For each OAuth provider (Discord, GitHub, Google, Twitch, YouTube), you must:

1. **Create an OAuth Application** in the provider's developer console
2. **Configure Redirect URIs** based on your setup:

#### Redirect URIs for Mobile App

Add these redirect URIs to your OAuth app configuration:

**For Authentication (Login/Signup):**
- `http://localhost:8080/auth/callback`
- `http://10.0.2.2:8080/auth/callback` (for emulator)
- `http://YOUR_MACHINE_IP:8080/auth/callback` (if using direct IP)

**For Service Linking:**
- `http://localhost:8080/service/callback`
- `http://10.0.2.2:8080/service/callback` (for emulator)
- `http://YOUR_MACHINE_IP:8080/service/callback` (if using direct IP)

#### Provider-Specific Setup

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Web application**
6. Add authorized redirect URIs (see above)
7. Copy the **Client ID** to `.env`

**Discord OAuth:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to **OAuth2** section
4. Add redirect URIs
5. Copy the **Client ID**

**GitHub OAuth:**
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Add redirect URIs
4. Copy the **Client ID**

Similar steps apply for Twitch and YouTube (uses Google OAuth).

## Project Structure

```
mobile-client/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── pages/                    # UI screens
│   │   ├── welcome_page.dart     # Landing page
│   │   ├── login_page.dart       # Login with OAuth
│   │   ├── sign_up_page.dart     # Registration with OAuth
│   │   ├── home_page.dart        # Main dashboard
│   │   ├── services_page.dart    # Service linking
│   │   ├── settings_page.dart    # Server configuration
│   │   └── actions_reactions_page.dart  # AREA management
│   ├── services/                 # Business logic
│   │   ├── auth_service.dart     # Authentication API
│   │   ├── area_api_service.dart # AREA CRUD operations
│   │   ├── service_api_service.dart  # Service linking API
│   │   ├── runtime_config.dart   # Server URL configuration
│   │   ├── discord_oauth_service.dart  # Discord OAuth helper
│   │   ├── github_oauth_service.dart   # GitHub OAuth helper
│   │   ├── google_oauth_service.dart   # Google OAuth helper
│   │   ├── twitch_oauth_service.dart   # Twitch OAuth helper
│   │   └── youtube_oauth_service.dart  # YouTube OAuth helper
│   ├── widgets/                  # Reusable UI components
│   │   ├── custom_button.dart
│   │   ├── custom_text_field.dart
│   │   ├── service_card.dart
│   │   └── area_card.dart
│   ├── theme/                    # App theming
│   │   └── app_theme.dart
│   └── utils/                    # Utilities
│       └── app_logger.dart       # Logging helper
├── .env                          # Environment variables
├── pubspec.yaml                  # Dependencies
└── README.md                     # This file
```

### Key Components

#### Services Layer
- **auth_service.dart**: Handles login, registration, and OAuth2 flows
- **area_api_service.dart**: Manages AREA CRUD (Create, Read, Update, Delete)
- **service_api_service.dart**: Handles service linking/unlinking
- **runtime_config.dart**: Manages server URL configuration with SharedPreferences
- **OAuth services**: WebView-based OAuth helpers for each provider

#### Pages
- **welcome_page.dart**: Initial landing page
- **login/sign_up_page.dart**: Authentication with email/password or OAuth
- **home_page.dart**: Main dashboard showing user's AREAs
- **services_page.dart**: List and link/unlink services
- **settings_page.dart**: Configure server URL and port
- **actions_reactions_page.dart**: Create and manage AREAs

## Contributing

### Development Workflow

1. **Fork the repository** and create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** following the code style guidelines

3. **Test your changes**:
```bash
# Run tests
flutter test

# Analyze code for issues
flutter analyze

# Format code
flutter format lib/
```

4. **Commit with descriptive messages**:
```bash
git add .
git commit -m "feat: add new OAuth provider support"
```

5. **Push and create a Pull Request**:
```bash
git push origin feature/your-feature-name
```

### Code Style Guidelines

- Follow [Dart Style Guide](https://dart.dev/guides/language/effective-dart/style)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use `async/await` for asynchronous operations
- Handle errors gracefully with try-catch blocks

### Adding a New OAuth Provider

To add support for a new OAuth provider (e.g., Spotify):

1. **Create OAuth Service** (`lib/services/spotify_oauth_service.dart`):
```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'runtime_config.dart';

class SpotifyOAuthService {
  static String get clientId => dotenv.env['SPOTIFY_CLIENT_ID'] ?? '';
  static const String scope = 'user-read-email user-read-private';

  static Future<String> _buildAuthUrl({required bool forService}) async {
    final baseUrl = await RuntimeConfig().getServerUrl();
    final redirectUri = forService ? '$baseUrl/service/callback' : '$baseUrl/auth/callback';

    final params = {
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'response_type': 'code',
      'scope': scope,
      'state': forService ? 'service-spotify' : 'spotify',
    };

    final uri = Uri.https('accounts.spotify.com', '/authorize', params);
    return uri.toString();
  }

  static Future<String?> authorize(BuildContext context, {bool forService = false}) async {
    final authUrl = await _buildAuthUrl(forService: forService);
    // ... WebView implementation
  }
}
```

2. **Add to Login/Signup Pages**: Import and create handler method

3. **Add to Services Page**: Include in OAuth provider list

4. **Update .env**: Add `SPOTIFY_CLIENT_ID=your_client_id`

5. **Backend Support**: Ensure backend supports the provider

### Adding a New AREA Component

To add support for a new AREA trigger or action:

1. **Backend**: Implement the component in `application-server/src/components/`
2. **Mobile**: The app dynamically fetches components from the backend
3. **Test**: Ensure the component appears in the component selector

### Common Development Tasks

**Update Dependencies:**
```bash
flutter pub upgrade
```

**Clean Build:**
```bash
flutter clean
flutter pub get
flutter run
```

**Generate APK:**
```bash
flutter build apk --release
```

**Generate App Bundle (for Play Store):**
```bash
flutter build appbundle --release
```

## Troubleshooting

### Common Issues

#### 1. "Connection Refused" Error

**Problem**: App can't connect to backend server

**Solutions**:
- Verify backend is running: `curl http://localhost:8080/health`
- Check `adb reverse` is set: `adb reverse tcp:8080 tcp:8080`
- For emulator, use `http://10.0.2.2:8080` in Settings
- Verify firewall allows port 8080
- Check `.env` has correct URL_BASE and PORT

#### 2. "OAuth Access Blocked" / Invalid Request

**Problem**: OAuth provider rejects the request

**Solutions**:
- Verify Client ID is correct in `.env`
- Check redirect URIs in provider console match your setup
- Ensure backend server URL is accessible
- For Google: Make sure all redirect URIs are added in Google Cloud Console

#### 3. "ADB Device Not Found"

**Problem**: `adb devices` shows no devices

**Solutions**:
- Enable USB debugging on Android device
- Try different USB cable (some are charge-only)
- Revoke USB debugging authorization and reconnect
- Restart ADB: `adb kill-server && adb start-server`
- Check USB connection mode (should be File Transfer/MTP)

#### 4. Flutter Build Errors

**Problem**: Build fails with dependency errors

**Solutions**:
```bash
flutter clean
flutter pub get
flutter pub upgrade
flutter run
```

#### 5. "Null Safety" Errors

**Problem**: Code uses null-unsafe operations

**Solutions**:
- Use null-aware operators: `?.`, `??`, `??=`
- Add null checks before accessing properties
- Use `late` keyword for non-nullable variables initialized later

#### 6. WebView Not Loading OAuth Page

**Problem**: Blank screen or loading forever

**Solutions**:
- Check internet connection on device
- Verify OAuth provider URL is correct
- Check device/emulator has network access
- For local testing, ensure backend is accessible from device

### Debugging Tips

**Enable Verbose Logging:**
```bash
flutter run -v
```

**View Device Logs:**
```bash
adb logcat | grep flutter
```

**Check Network Traffic:**
```bash
# View all HTTP requests from device
adb logcat | grep "chromium"
```

**Debug Mode Features:**
- Hot reload: Press `r` in terminal
- Widget inspector: Enable in debug banner
- Performance overlay: `flutter run --profile`

## Additional Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Language Guide](https://dart.dev/guides)
- [Material Design Guidelines](https://m3.material.io/)
- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb)
- [OAuth 2.0 Documentation](https://oauth.net/2/)

## License

This project is part of the AREA ecosystem. See the main project LICENSE file for details.

## Support

For issues and questions:
- Check [Troubleshooting](#troubleshooting) section
- Review existing GitHub Issues
- Create a new issue with detailed description and logs
- Contact the development team

---

**Happy Coding! 🚀**
