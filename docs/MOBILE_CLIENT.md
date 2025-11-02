# AREA Mobile Client Documentation

Go back to the [main README](../README.md).

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
  - [Building for Production (APK)](#building-for-production-apk)
  - [Running Tests](#running-tests)
- [Features](#features)
- [Architecture](#architecture)
- [API Interaction](#api-interaction)
- [State Management](#state-management)
- [Styling](#styling)
- [Testing](#testing)
- [Build & Deployment (Docker)](#build--deployment-docker)
- [File Structure](#file-structure)
- [References](#references)

## Overview

The AREA Mobile Client is the native mobile application (initially targeting Android) for the AREA automation platform. It provides a user interface for managing AREA workflows on the go, allowing users to register, log in, connect services, and create/manage their automations.

Following the project's core principle, the Mobile Client **does not implement business logic**. It acts purely as an interface, fetching data from and sending commands to the Application Server via its REST API. The client also handles device-specific interactions like OAuth flows using WebViews.

## Technology Stack

- **Framework**: [Flutter](https://flutter.dev/) (Stable channel)
- **Language**: [Dart](https://dart.dev/)
- **State Management**: Primarily `setState` and `FutureBuilder` based on the provided code snippets. `shared_preferences` is used for token storage.
- **HTTP Client**: [`http`](https://pub.dev/packages/http) package.
- **Environment Variables**: [`flutter_dotenv`](https://pub.dev/packages/flutter_dotenv) package.
- **Web Views**: [`webview_flutter`](https://pub.dev/packages/webview_flutter) for handling OAuth redirects.
- **URL Launching**: [`url_launcher`](https://pub.dev/packages/url_launcher) (dependency listed, potentially for external links).
- **Linting**: [`flutter_lints`](https://pub.dev/packages/flutter_lints).
- **Testing**: `flutter_test` (Widget testing).
- **Platform Target**: Android (as per Dockerfile and initial setup). iOS setup might require additional configuration.

## Getting Started

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (Stable channel recommended)
- [Android SDK](https://developer.android.com/studio) (for Android development/emulation)
- [Java Development Kit (JDK)](https://openjdk.java.net/) (usually included with Android Studio or installable separately, JDK 17 used in Docker build)
- An Android Emulator or a physical Android device enabled for development.
- A running instance of the [AREA Application Server](./APPLICATION_SERVER.md).

### Environment Variables

Configuration is primarily managed via a `.env` file at the root of the `mobile-client` directory. Copy `.env.example` to `.env`.

- `URL_BASE`: The base URL of the Application Server (e.g., `http://10.0.2.2` for Android Emulator accessing host machine localhost, or your server's IP).
- `PORT`: The port the Application Server is running on (defaults to `8080`).
- `TOKEN_KEY`: Key for storing JWT in `SharedPreferences` (defaults to `auth_token`).
- `DISCORD_CLIENT_ID`: Discord OAuth Client ID.
- `DISCORD_REDIRECT_URI`: Redirect URI configured for Discord OAuth (must match server config for mobile).

*(Note: The `flutter_dotenv` package loads these variables at runtime.)*

### Installation

Navigate to the `mobile-client` directory and fetch dependencies:

```bash
cd mobile-client
flutter pub get
````

### Running Locally

1. Ensure an Android Emulator is running or a device is connected (`flutter devices`).

2. Run the application:

    ```bash
    flutter run
    ```

### Building for Production (APK)

To build the release APK:

```bash
flutter build apk --release
```

The output APK will typically be located in `build/app/outputs/flutter-apk/app-release.apk`.

### Running Tests

To run widget tests:

```bash
flutter test
```

## Features

- **Welcome Screen**: Initial screen with options to Login or Sign Up.
- **User Authentication**:
  - Sign Up with Email/Username/Password.
  - Login with Email/Password.
  - JWT Token Management using `shared_preferences`.
  - Automatic navigation to Home Page after successful login/signup.
- **Home Page/Dashboard**:
  - Main screen after authentication.
  - Displays existing AREAs (fetched via `AreaApiService`).
  - Allows activating/deactivating AREAs (via `AreaApiService.updateArea`).
  - Allows deleting AREAs (via `AreaApiService.deleteArea`).
  - Navigation to create new AREAs and manage services.
- **Service Management**:
  - List available and linked services.
  - Link new services, handling OAuth flow via WebView for providers like Discord.
  - Unlink existing services.
- **AREA Creation**:
  - Dedicated page to create new AREA workflows.
  - Select Action and REAction components from linked services using `ComponentSelector` widget.
  - Input required parameters for selected components using `CustomTextField`.
  - Define AREA name and optional description.
  - Submit configuration to the server (`AreaApiService.createAreaWithParameters`).
- **Settings**:
  - Includes functionality to configure the Application Server URL (as required by the subject). *(Implementation details might vary, potentially using `SharedPreferences`)*.
  - Logout functionality.

## Architecture

- **UI Framework**: Flutter, using Material Design widgets.
- **Structure**: Organized into `pages` (screens), `services` (API communication), `widgets` (reusable UI components), and `utils` (helpers like logging).
- **Navigation**: Uses Flutter's built-in `Navigator` (`MaterialPageRoute`) for screen transitions.
- **API Layer**: Centralized in the `lib/services/` directory. Each service class (`AuthService`, `AreaApiService`, `ServiceApiService`) handles communication with specific parts of the backend API.
- **Asynchronicity**: Uses `Future`s and `async/await` extensively for handling API calls and other asynchronous operations. `FutureBuilder` is likely used in UI to handle loading/error states.

## API Interaction

- **Service Classes**: Located in `lib/services/`.
  - `AuthService`: Handles login, registration, token storage (`SharedPreferences`).
  - `AreaApiService`: Handles fetching, creating, updating, deleting AREAs.
  - `ServiceApiService`: Handles fetching services, components, variables, linking/unlinking services.
  - `DiscordOAuthService`: Manages the Discord OAuth flow using `webview_flutter`.
- **Base URL Configuration**: API services construct URLs using `baseUrl` and `port` derived from `flutter_dotenv` or potentially a configurable setting.
- **Authentication**: `AuthService.getAuthHeaders()` retrieves the stored JWT token and prepares the `Authorization: Bearer <token>` header, which is then used by other API service calls.
- **Error Handling**: API service methods typically use `try...catch` blocks. Errors might be logged (`AppLogger`) or rethrown to be handled by the UI (e.g., showing `SnackBar` messages or error dialogs).
- **JSON Handling**: Uses `dart:convert` (`jsonEncode`, `jsonDecode`) for request/response bodies.

## State Management

- **Local Widget State**: Uses `StatefulWidget` and `setState` for managing UI state within individual widgets/pages (e.g., form inputs, loading indicators).
- **Asynchronous Data**: `FutureBuilder` is likely used in pages like `HomePage` and `ServicesPage` to handle the loading and display of data fetched from the API.
- **Authentication Token**: Persisted across app sessions using the `shared_preferences` package, managed by `AuthService`.
- **Server URL Configuration**: Likely stored using `shared_preferences` for persistence across app restarts.

*(Note: No complex global state management solution like Provider, Riverpod, or BLoC seems to be implemented based on the provided files.)*

## Styling

- **Theme**: Uses Flutter's `ThemeData` with Material 3 enabled. A primary color scheme (`Colors.blue`) and specific themes for `AppBar`, `ElevatedButton`, and `InputDecoration` are defined in `main.dart`.
- **Widgets**: Standard Material Design widgets (`Scaffold`, `AppBar`, `ElevatedButton`, `TextFormField`, `Card`, etc.) are used, along with custom reusable widgets in `lib/widgets/` (e.g., `CustomTextField`, `PasswordField`, `CustomButton`, `ServiceCard`, `ComponentSelector`).

## Testing

- **Framework**: `flutter_test` is included for widget testing.
- **Example Test**: A basic widget test exists in `test/widget_test.dart`.
- **Coverage**: No specific coverage setup is visible in the provided files, but `flutter test --coverage` can be used.

## Build & Deployment (Docker)

- **Dockerfile**: `mobile-client/Dockerfile` defines the build process for the Android APK within a Docker container.
  - Uses an `ubuntu:24.04` base image.
  - Installs Java, Android SDK command-line tools, and Flutter SDK.
  - Copies project files.
  - Runs `flutter pub get`.
  - Runs `flutter build apk --release`.
  - Exports the built `app-release.apk` (renamed to `client.apk`) to the `/app/build` volume.
- **Docker Compose**: The main `docker-compose.yaml` defines the `client_mobile` service:
  - Builds the image using the `mobile-client/Dockerfile`.
  - Mounts the `mobile-builds` volume to `/app/build`, making the generated APK available to other services (specifically `client_web`).

## File Structure

```txt
mobile-client/
├── android/              # Android specific project files
├── ios/                  # iOS specific project files (if configured)
├── lib/
│   ├── main.dart         # App entry point, theme setup
│   ├── pages/            # Screen/Page widgets (Welcome, Login, SignUp, Home, Services, CreateArea...)
│   ├── services/         # API interaction logic (Auth, Area, Service, OAuth...)
│   ├── utils/            # Utility classes (AppLogger...)
│   └── widgets/          # Reusable UI components (CustomButton, ServiceCard...)
├── linux/                # Linux specific project files (if configured)
├── test/                 # Test files (widget_test.dart)
├── web/                  # Web specific project files (if configured)
├── windows/              # Windows specific project files (if configured)
├── .env.example          # Environment variable template
├── .gitignore
├── .metadata             # Flutter project metadata
├── Dockerfile            # Docker build definition for APK
├── README.md             # Basic project information
├── analysis_options.yaml # Dart analyzer configuration (lints)
├── pubspec.lock          # Locked dependency versions
└── pubspec.yaml          # Project dependencies and metadata
```

## References

- [README.md](../README.md) - Main project documentation
- [APPLICATION\_SERVER.md](../APPLICATION_SERVER.md) - Backend documentation
- [ENDPOINTS.md](./ENDPOINTS.md) - Detailed API endpoints
- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Documentation](https://dart.dev/guides)
- Package Documentation (linked in [Technology Stack](#technology-stack))

-----

*This document describes the Flutter-based mobile client for the AREA project.*
