# AREA Application Server Documentation

Go back to the [main README](../README.md).

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Configuration](#configuration)
  - [Local Development](#local-development)
  - [Running Tests](#running-tests)
- [General Information](#general-information)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [File Structure](#file-structure)
- [Database Schema](#database-schema)
- [References](#references)

## Overview

The AREA Application Server is the core backend component of the AREA project, built with NestJS. It implements all business logic for the automation platform and exposes functionality through a REST API consumed by the web and mobile clients.

### Key Responsibilities

- **User Management**: Handles registration, authentication (email/password & OAuth2), profile updates, and secure password management using bcrypt.
- **Service Integration**: Manages connections to third-party services (e.g., Google, Discord, GitHub), including OAuth2 token handling (storage, refresh).
- **Component Management**: Defines available Actions (triggers) and REActions (tasks) provided by each integrated service.
- **AREA Orchestration**: Allows users to create, configure, update, activate/deactivate, and delete automation workflows (AREAs) linking an Action to a REAction.
- **API Gateway**: Provides RESTful endpoints documented with Swagger (OpenAPI) for client applications.
- **Event Processing**: Handles triggers via Cron jobs (`@nestjs/schedule`), incoming webhooks, and external event listeners (e.g., Discord bot events, API polling).
- **Execution Tracking**: Logs the execution status (pending, running, success, failed) and results/errors of triggered AREAs.
- **State Management**: Prevents duplicate triggers for certain actions using a state persistence mechanism (`HookStatesService`).

### Technical Stack

- **Framework**: [NestJS](https://nestjs.com/) v11
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [TypeORM](https://typeorm.io/)
- **Authentication**: [JWT](https://jwt.io/) (via `@nestjs/jwt`), [Passport.js](http://www.passportjs.org/) (`passport-local`, `passport-jwt`), OAuth2 integration, [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing
- **API Specification**: Swagger (OpenAPI) via `@nestjs/swagger`
- **Scheduling**: `@nestjs/schedule` for Cron jobs
- **HTTP Client**: `@nestjs/axios`
- **Validation**: `class-validator`, `zod` (for environment variables)
- **Container**: Docker
- **Orchestration**: Docker Compose
- **Linting/Formatting**: ESLint, Prettier
- **Testing**: Jest

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 recommended, see Dockerfile)
- [npm](https://www.npmjs.com/) (v10+) or pnpm
- [Docker](https://docs.docker.com/engine/install/) & [Docker Compose](https://docs.docker.com/compose/install/) (for containerized setup)
- [PostgreSQL](https://www.postgresql.org/download/) Server (if running locally without Docker)

### Environment Variables

Configuration is managed via environment variables. Create a `.env` file in the `application-server` directory by copying `.env.example`. Key variables include:

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Database connection details.
- `SERVER_URL`: Public base URL of the server (used for constructing icon URLs, etc.).
- `PORT`: Port the server listens on (defaults to 8080).
- `NODE_ENV`: Set to `development` or `production`. Affects DB sync, logging, and env validation strictness.
- `JWT_SECRET`: Secret key for signing JWT tokens (required in production).
- `JWT_EXPIRES_IN`: Token expiration time (e.g., `24h`, `3600`).
- `BCRYPT_SALT_ROUNDS`: Cost factor for bcrypt hashing (defaults to 10).
- OAuth2 Client IDs & Secrets: `DISCORD_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, etc. (Required based on enabled services, especially in production).
- `DISCORD_BOT_TOKEN`: Required for Discord actions/reactions involving the bot.
- `SMTP_USER`, `SMTP_PASS`: Credentials for sending real emails (currently uses Gmail SMTP).
- Redirect URIs: `WEB_AUTH_REDIRECT_URI`, `MOBILE_SERVICE_REDIRECT_URI`, etc.

Refer to `application-server/.env.example` for the full list and `application-server/src/config/env.validation.ts` for validation rules.

### Configuration

Application configuration is loaded via `@nestjs/config` and structured in `application-server/src/config/app.config.ts`. This includes database settings, JWT options, OAuth credentials, and server settings derived from environment variables.

### Local Development

1. Navigate to the `application-server` directory.
2. Install dependencies: `npm install` (or `pnpm install`).
3. Ensure a PostgreSQL database is running and accessible. Configure connection details in your `.env` file. You can use the Docker setup in `dev/database` (`cd dev/database && docker-compose up`) or a local installation.
4. Start the server in watch mode: `npm run start:dev`.
5. The server will be available at `http://localhost:<PORT>` (default 8080).
6. API documentation (Swagger UI) is available at `http://localhost:<PORT>/docs`.

### Running Tests

Execute the following commands within the `application-server` directory:

- Run unit tests: `npm test`
- Run unit tests in watch mode: `npm run test:watch`
- Run end-to-end tests: `npm run test:e2e`
- Generate coverage report: `npm run test:cov`

## General Information

- **Base URL:** Defined by `SERVER_URL` and `PORT` env vars. Defaults to `http://localhost:8080/`. Swagger UI is at `/docs`.
- **Content Type:** All API requests and responses use `application/json`.
- **Authentication:** Most endpoints require a JWT token passed in the `Authorization: Bearer <token>` header. Public endpoints are `/auth/login`, `/auth/register`, `/auth/login-oauth2`, `/auth/register-oauth2`, and `/about.json`.
- **CORS Policy:** Enabled by default in `main.ts` for `origin: true` (reflects request origin), allowing standard methods and headers.
- **API Versioning:** Currently unversioned. Endpoints are stable.
- **Validation:** Incoming request bodies are automatically validated against DTOs using `class-validator` via `ValidationPipe`.

## Authentication

Authentication is handled by the `AuthModule`.

### Authentication Methods

- **Email/Password (Local Strategy)**:
  - Users register via `POST /auth/register`. Passwords are hashed using bcrypt.
  - Users log in via `POST /auth/login` using email and password.
  - On success, a JWT token is returned.
- **OAuth2**:
  - Users can register or log in using supported providers (currently Google is implemented for this flow) via `POST /auth/register-oauth2` or `POST /auth/login-oauth2`.
  - The client initiates the OAuth flow, obtains an authorization code, and sends it to the server along with the `provider` and `redirect_uri`.
  - The server (`AuthService` via `OAuth2Service`) exchanges the code for tokens and fetches user info from the provider.
  - The server links the external account (`UserOAuth2Account`) to an existing or newly created internal user account based on email.
  - On success, a JWT token for the internal user account is returned.

### Using the Token

- Include the token in the `Authorization` header for protected endpoints:

```http
Authorization: Bearer <your.jwt.token>
```

- Tokens expire based on the `JWT_EXPIRES_IN` configuration. Clients should handle expiration and re-authentication. The `JwtAuthGuard` protects routes.

## Endpoints

A detailed list of all endpoints, including request/response schemas and authorization requirements, is available in:

- **[docs/ENDPOINTS.md](docs/ENDPOINTS.md)**
- **Swagger UI:** Accessible at `/docs` when the server is running.

Key endpoint categories:

- `/auth/*`: User authentication and profile management.
- `/users/*`: Direct user management (potentially admin-focused, though currently basic).
- `/services/*`: Listing available services, managing user links to services (including OAuth callbacks).
- `/components/*`: Listing available Actions and REActions.
- `/variables/*`: Listing parameters and return values for components.
- `/areas/*`: Creating, reading, updating, deleting, and managing user-specific AREA workflows.
- `/area-parameters/*`: Managing the specific values set for variables within an AREA.
- `/area-executions/*`: Viewing the history and status of AREA executions.
- `/hook-states/*`: Internal state management for triggers (timers, webhooks, etc.).
- `/webhooks/*`: Endpoints for receiving external webhooks (e.g., GitHub).
- [cite\_start]`/about.json`: Server metadata endpoint required by the Epitech subject[cite: 206].
- `/.well-known/*`: Endpoints for mobile app deep linking configuration (AssetLinks, Apple App Site Association).

*(Note: Admin endpoints listed in `ENDPOINTS.md` are defined but not currently implemented in the provided controllers/modules.)*

## Examples

### Register a New User

**Request:**

```http
POST /auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "username": "testuser",
  "password": "Password123!"
}
```

**Response:** (`201 Created`)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get User Profile

**Request:**

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** (`200 OK`)

```json
{
  "id": 1,
  "email": "test@example.com",
  "username": "testuser",
  "icon_url": null,
  "is_admin": false,
  "is_active": true,
  "created_at": "2025-10-29T17:00:00.000Z",
  "updated_at": "2025-10-29T17:00:00.000Z",
  "last_connection_at": "2025-10-29T17:05:00.000Z"
}
```

### Create an AREA (Timer sends Email)

**Request:**

```http
POST /areas/create-with-parameters
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "area": {
    "name": "Daily Email Reminder",
    "description": "Send email at 9 AM daily",
    "component_action_id": 1, // Assuming ID 1 is 'daily_timer'
    "component_reaction_id": 5, // Assuming ID 5 is 'send_email'
    "is_active": true
  },
  "parameters": {
    "time": "09:00", // Parameter for 'daily_timer'
    "to": "me@example.com", // Parameter for 'send_email'
    "subject": "Daily Reminder" // Parameter for 'send_email'
  }
}
```

**Response:** (`201 Created`)

```json
{
    "user_id": 1,
    "component_action_id": 1,
    "component_reaction_id": 5,
    "name": "Daily Email Reminder",
    "description": "Send email at 9 AM daily",
    "is_active": true,
    "id": 10, // New AREA ID
    "created_at": "2025-10-29T17:10:00.000Z",
    "updated_at": "2025-10-29T17:10:00.000Z",
    "last_triggered_at": null,
    "triggered_count": 0
}
```

## Error Handling

- NestJS built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ConflictException`, `InternalServerErrorException`) are used throughout the services and controllers.
- The global `ValidationPipe` automatically returns `400 Bad Request` errors for invalid DTOs.
- Custom exceptions like `ConfigurationException` are used for environment validation errors.
- Errors during AREA execution are caught, logged, and stored in the `area_executions` table (`errorMessage` field).

## File Structure

```txt
src/
├── app.controller.ts         # Handles /about.json
├── app.module.ts             # Root application module
├── app.service.ts            # Logic for /about.json
├── main.ts                   # Application entry point & setup (pipes, cors, swagger)
├── config/                   # Configuration loading & validation
├── common/                   # Shared utilities (constants, exceptions, services like ReactionProcessor, VariableInterpolation)
├── auth/                     # Authentication (login, register, profile, strategies, guards, OAuth2 user linking)
├── users/                    # User entity, service, controller, DTOs
├── services/                 # Service entity, service, controller, DTOs, User-Service linking logic, Service Initializer
├── components/               # Component entity, service, controller, DTOs
├── variables/                # Variable entity, service, controller, DTOs
├── areas/                    # AREA entity, service, controller, DTOs
├── area-parameters/          # AREA Parameter entity, service, controller, DTOs
├── area-executions/          # AREA Execution entity, service, controller, DTOs
├── hook-states/              # Hook State entity, service, controller, DTOs (for trigger state management)
├── oauth2/                   # Core OAuth2 service, DTOs, mobile utils
├── clock/                    # Cron job service for timer actions
├── email/                    # Email sending services (real and fake)
├── github/                   # GitHub service, webhook controller
├── discord/                  # Discord service (bot interactions)
├── gmail/                    # Gmail service (polling, sending)
├── twitch/                   # Twitch service (polling, sending)
├── youtube/                  # (Placeholder service, likely needs implementation)
└── well-known/               # Controller for mobile deep linking files
test/                         # End-to-end tests
```

## Database Schema

Entities define the database schema using TypeORM decorators. Key entities include:

- **`User`**: Stores user account information (email, username, hashed password, etc.).
- **`Service`**: Defines available third-party services (name, description, requires auth).
- **`Component`**: Defines Actions and REActions belonging to a Service (type, name, description, trigger mechanism config).
- **`Variable`**: Defines parameters (inputs) and return values (outputs) for Components.
- **`Area`**: Represents a user-created workflow linking an Action Component to a REAction Component.
- **`AreaParameter`**: Stores the specific value provided by the user for a Variable within a specific Area.
- **`UserService`**: Links a User to a Service, storing OAuth tokens if required.
- **`UserOAuth2Account`**: Links a User's external OAuth2 account ID (from a specific Service) to their internal User account.
- **`AreaExecution`**: Logs each time an Area is triggered, storing status, trigger data, results, and errors.
- **`HookState`**: Stores state information needed by triggers to avoid duplicates (e.g., last checked timestamp, last processed item ID).

Refer to the entity files (`*.entity.ts`) within each module for detailed column definitions and relationships. The [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) also provides a schema overview.

## References

### Related Documentation

- [README.md](../README.md) - Main project documentation
- [docs/ENDPOINTS.md](docs/ENDPOINTS.md) - Detailed API endpoint documentation
- [docs/TECHNICAL\_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md) - Broader technical overview
- [docs/COMPONENTS\_DOCUMENTATION.md](docs/COMPONENTS_DOCUMENTATION.md) - Detailed component/variable definitions
- [docker-compose.yml](../docker-compose.yml) - Container orchestration
- [Dockerfile](Dockerfile) - Server container build definition

### External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Swagger Documentation](https://swagger.io/)

-----

*This documentation describes the NestJS backend for the AREA project.*
