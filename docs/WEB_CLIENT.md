# AREA Web Client Documentation

Go back to the [main README](../README.md).

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
  - [Building for Production](#building-for-production)
  - [Running Tests](#running-tests)
- [Features](#features)
- [Architecture](#architecture)
- [API Interaction](#api-interaction)
- [State Management](#state-management)
- [Styling](#styling)
- [Testing](#testing)
- [Deployment](#deployment)
- [File Structure](#file-structure)
- [References](#references)

## Overview

The AREA Web Client is the browser-based user interface for the AREA automation platform. It allows users to register, log in, manage their profile, connect services, create and manage AREA workflows (Actions linked to REActions).

[cite_start]As per the project requirements, the Web Client **does not contain any business logic**[cite: 36, 173]. [cite_start]Its sole responsibility is to display information fetched from the Application Server and to send user requests back to the server via its REST API[cite: 34, 168].

## Technology Stack

- **Framework**: [React](https://react.dev/) v19
- **Build Tool**: [Vite](https://vitejs.dev/) (using Rolldown)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Routing**: [React Router](https://reactrouter.com/) v7
- **State Management**: React Hooks (`useState`, `useEffect`), Custom Hooks (`useAuth`, `useAreas`)
- **API Client**: Native `fetch` API (wrapped in `src/services/api.ts`)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Vitest, React Testing Library, jsdom

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended, matching the Docker build environment)
- [npm](https://www.npmjs.com/) (v10+) or pnpm
- A running instance of the [AREA Application Server](./APPLICATION_SERVER.md.md)

### Environment Variables

Configuration is managed via environment variables loaded by Vite. Create a `.env` file in the `web-client` directory by copying `web-client/.env.example`.

- `VITE_API_BASE_URL`: The base URL of the running Application Server (e.g., `http://localhost:8080`). Required.
- `VITE_TOKEN_KEY`: The key used to store the JWT token in `localStorage` (defaults to `auth_token`). Optional.
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth2 Client ID for authentication/linking.
- `VITE_GOOGLE_REDIRECT_URI`: Redirect URI configured in Google Cloud Console for OAuth callbacks (must match server config).

### Installation

Navigate to the `web-client` directory and install dependencies:

```bash
cd web-client
npm install
# or
# pnpm install
````

### Running Locally

To start the development server (defaults to port 8081):

```bash
npm run dev
```

The web client will be accessible at `http://localhost:8081`.

### Building for Production

To create a production build (static files in `web-client/dist`):

```bash
npm run build
```

### Running Tests

Execute the following commands within the `web-client` directory:

- Run tests once with coverage: `npm run test:run -- --coverage`
- Run tests in watch mode: `npm test`
- Run tests with Vitest UI: `npm run test:ui`

## Features

- **Landing Page**: Introduction to AREA, navigation to login/signup.
- **User Authentication**:
  - Sign Up with Email/Username/Password.
  - Login with Email/Password.
  - Sign Up/Login with Google OAuth2.
  - OAuth2 Callback Handling.
  - JWT Token Management (localStorage).
  - Protected Routes for authenticated users.
- **User Profile/Dashboard**:
  - Displays user information (fetched via `/auth/me`).
  - Lists the user's created AREAs.
  - Allows searching/filtering AREAs.
  - Allows activating/deactivating AREAs.
  - Allows deleting AREAs.
  - Provides navigation to create new AREAs.
  - User profile menu with logout option.
- **AREA Creation**:
  - Multi-step workflow: Select Action Service -\> Select Action Component -\> Select Reaction Service -\> Select Reaction Component -\> Configure Parameters -\> Configure Name/Description -\> Create.
  - Dynamically fetches available services and components from the API.
  - Dynamically displays required parameters based on selected components (using static config `componentParameters.ts` or potentially API fetch in future).
  - Submits AREA configuration and parameters to the server.
- **Service Linking**: Handles the OAuth callback redirection from the server after initiating linking, sending the code back to the server (`/services/:id/link`). (Note: Initiating linking likely happens in UserProfile or a dedicated Services page, not fully shown in provided `UserProfile.tsx`).

## Architecture

The web client is a standard Single Page Application (SPA) built with React and Vite.

- **Entry Point**: `web-client/index.html` loads `src/app/pages/main.tsx`.
- **Routing**: `react-router-dom` manages browser-based routing. Routes are defined in `main.tsx`.
- **Components**: UI is built using functional React components located in `src/components/` (reusable) and `src/app/pages/` (page-level).
- **API Layer**: All communication with the Application Server happens through functions defined in `src/services/api.ts`, which wrap `fetch` calls and handle authentication headers.
- **State Management**: See [State Management](#state-management).
- **Build Process**: Vite bundles the TypeScript/React code into static HTML, CSS, and JavaScript files for production.

## API Interaction

- The `src/services/api.ts` file centralizes all API calls to the backend.
- It uses the base URL defined in `VITE_API_BASE_URL`.
- **Authentication**:
  - The `tokenService` object manages the JWT token stored in `localStorage`.
  - For authenticated requests, the token is retrieved using `tokenService.getToken()` and added to the `Authorization: Bearer <token>` header.
  - Login/Register functions (`authApi.login`, `authApi.register`, etc.) receive the token from the server response and store it using `tokenService.setToken()`.
  - Logout (`useAuth` hook) removes the token using `tokenService.removeToken()`.
- **Error Handling**: The `handleResponse` utility function checks HTTP status codes and attempts to parse JSON error messages from the server, throwing JavaScript `Error` objects. UI components typically catch these errors to display messages to the user.
- **Data Fetching**: Custom hooks like `useAuth` and `useAreas` encapsulate data fetching logic using `useEffect` and API service functions.

## State Management

- **Local Component State**: `useState` is used extensively within components for UI state (e.g., form data, loading indicators, error messages).
- **Shared Authentication State**: The `useAuth` custom hook provides global access to the current user's profile and authentication status. It fetches the profile on mount if a token exists.
- **Shared AREA Data**: The `useAreas` custom hook manages fetching, creating, updating, and deleting AREA data, providing the list of areas to components like `UserProfile`.
- **Authentication Token**: The JWT token itself is persisted in `localStorage` via the `tokenService` helper object.

*(Note: State management libraries like Redux, Zustand, or Context API beyond simple hooks are not prominently used in the provided code snippets, but could be present elsewhere or added later.)*

## Styling

- **Tailwind CSS**: Utility-first CSS framework used for styling components directly in the TSX files.
- **Global Styles/Fonts**: Basic setup and font imports (`Luckiest Guy`) are in `src/app/pages/index.css`.
- **Icons**: A library of SVG icons for various services is provided in `src/lib/appIcons.tsx`.

## Testing

- **Framework**: Vitest is used as the test runner, configured in `web-client/vitest.config.ts`.
- **Utilities**: React Testing Library is used for rendering components and querying the DOM during tests.
- **Environment**: `jsdom` is configured to simulate a browser environment.
- **Setup**: `src/test/setup.ts` configures testing library cleanup and mocks browser APIs like `IntersectionObserver`, `ResizeObserver`, `matchMedia`, etc..
- **Coverage**: Uses `@vitest/coverage-v8` for code coverage reporting.
- **Test Files**: Located in `src/test/`, typically ending with `.test.tsx`. Examples cover component rendering (`App.test.tsx`, `Login.test.tsx`), basic integration (`Integration.test.tsx`), accessibility (`Accessibility.test.tsx`), and utility checks (`AppIcons.test.tsx`).

## Deployment

- **Build Output**: `npm run build` generates static HTML, CSS, and JS files in the `web-client/dist` directory.
- **Docker Container**: The `web-client/Dockerfile` defines a multi-stage build:
    1. A `builder` stage uses `node:22-alpine` to install dependencies and build the React app.
    2. A final stage uses `nginx:stable-alpine` to serve the static files from `/usr/share/nginx/html`.
- **Nginx Configuration**: `web-client/nginx.conf` configures Nginx:
  - Serves the React app, handling SPA routing using `try_files`.
  - [cite\_start]Serves the `client.apk` file (copied from a shared volume) at the `/client.apk` path[cite: 203].
- **Docker Compose**: The main `docker-compose.yaml` defines the `client_web` service, builds the image using the Dockerfile, maps port 8081 on the host to port 80 in the container, and mounts the `mobile-builds` volume to `/usr/share/nginx/html/mobile` to access the APK.

## File Structure

```txt
web-client/
├── public/               # Static assets
├── src/
│   ├── app/
│   │   └── pages/        # Page components (App, Login, SignUp, UserProfile, CreateArea...)
│   ├── components/       # Reusable UI components (AreaCard, ProtectedRoute...)
│   ├── config/           # Application configuration (e.g., componentParameters.ts)
│   ├── hooks/            # Custom React hooks (useAuth, useAreas...)
│   ├── lib/              # Utility libraries (appIcons, googleOAuth...)
│   ├── services/         # API interaction layer (api.ts)
│   └── test/             # Test files and setup
├── .env.example          # Environment variable template
├── .gitignore
├── .prettierrc
├── Dockerfile            # Docker build definition
├── eslint.config.js      # ESLint configuration
├── index.html            # HTML entry point
├── nginx.conf            # Nginx configuration for Docker deployment
├── package.json          # Project dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # Base TypeScript configuration
├── tsconfig.app.json     # TypeScript configuration for the app build
├── tsconfig.node.json    # TypeScript configuration for Node scripts (like vite.config.ts)
├── vite.config.ts        # Vite build tool configuration
└── vitest.config.ts      # Vitest test runner configuration
```

## References

- [README.md](../README.md) - Main project documentation
- [APPLICATION\_SERVER.md](./APPLICATION_SERVER.md) - Backend documentation
- [ENDPOINTS.md](./ENDPOINTS.md) - Detailed API endpoints
- [React Documentation](https://react.dev/) - Official React documentation
- [Vite Documentation](https://vitejs.dev/) - Official Vite documentation
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Official Tailwind CSS documentation
- [React Router Documentation](https://reactrouter.com/) - Official React Router documentation
- [Vitest Documentation](https://vitest.dev/) - Official Vitest documentation

-----

*This document describes the React-based web client for the AREA project.*
