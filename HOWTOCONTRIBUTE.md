
# How to Contribute to AREA

Thank you for your interest in contributing to the AREA platform! This guide explains how to extend the platform by adding new services, actions, reactions, and other features, based on our current architecture.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Structure Overview](#project-structure-overview)
- [Adding a New Service](#adding-a-new-service)
- [Adding a New Action](#adding-a-new-action)
- [Adding a New REAction](#adding-a-new-reaction)
- [Understanding Hooks](#understanding-hooks)
- [Adding an OAuth2 Provider](#adding-an-oauth2-provider)
- [Updating the Clients](#updating-the-clients)
- [Testing Your Contributions](#testing-your-contributions)
- [Code Style and Standards](#code-style-and-standards)
- [Pull Request Process](#pull-request-process)
- [Common Pitfalls](#common-pitfalls)

## Development Environment Setup

1. **Fork & Clone:** Fork the main repository on GitHub and clone your fork locally.
2. **Create Branch:** Create a feature branch from `main`: `git checkout -b feature/your-feature-name`.
3. **Environment:** Copy `.env.example` files in the root, `application-server`, and `web-client` directories to `.env` and fill in necessary credentials (API keys, database config, etc.).
4. **Docker (Recommended):**
    - Build the images: `docker-compose build`.
    - Start all services: `docker-compose up`.
5. **Local Development (Alternative):**
    - **Server:** `cd application-server && npm install && npm run start:dev`.
    - **Web Client:** `cd web-client && npm install && npm run dev`.
    - **Mobile Client:** `cd mobile-client && flutter pub get && flutter run`. Ensure Flutter and Android/iOS dependencies are installed.

## Project Structure Overview

- **`application-server/`**: NestJS backend. Contains all business logic, API endpoints, database interactions (TypeORM), and service integrations. This is where most contribution logic resides.
- **`web-client/`**: React + Vite frontend. User interface for browsers. Communicates solely via REST API calls to the server.
- **`mobile-client/`**: Flutter application (Android/iOS). User interface for mobile. Communicates solely via REST API calls to the server.
- **`docker-compose.yaml`**: Defines how services are built and run together.
- **`docs/`**: Project documentation, including the Epitech subject PDF.

## Adding a New Service

A Service represents an external platform (e.g., Spotify, a weather API).

1. **Server: Create Module & Service:**
    - Create `application-server/src/<service-name>/` folder.
    - Inside, create `<service-name>.module.ts`, `<service-name>.service.ts`.
    - Implement logic to interact with the external API (use `@nestjs/axios`). Handle authentication (OAuth2 if needed).
    - Register the module in `application-server/src/app.module.ts`.
2. **Server: Initialize Service Entry:**
    - Edit `application-server/src/services/services-initializer.service.ts`.
    - Add a `create<ServiceName>Service` method.
    - Inside, check if the service exists (`servicesService.findByName`).
    - If not, call `servicesService.create` to add a record to the `services` table, defining `name`, `description`, `icon_path`, `requires_auth`, `is_active`.
    - Call this method from `initializeDefaultServices`.
3. **Server: Handle OAuth2 (if `requires_auth: true`):**
    - Add credentials to `.env.example` and `src/config/app.config.ts`.
    - Update `OAuthProvider` enum and related maps/functions in `src/oauth2/dto/oauth-providers.dto.ts`.
    - Extend `OAuth2Service` (`src/oauth2/oauth2.service.ts`) to handle token exchange, refresh, and user info fetching for the new provider.
    - Update `ServicesService` (`src/services/services.service.ts`) to integrate the new provider in `linkService` and `refreshServiceToken`.
4. **Clients: Update UI:**
    - Add the service icon (e.g., in `web-client/src/lib/appIcons.tsx`).
    - Ensure the service appears in lists (`UserProfile.tsx`, `services_page.dart`).
    - Implement the client-side OAuth flow if needed.

## Adding a New Action

Actions are triggers (e.g., "New Email Received").

1. **Server: Define Component & Variables:**
    - In the service's initialization method (`services-initializer.service.ts`), call `componentsService.create` with `type: ComponentType.ACTION`, a unique `name` (e.g., `new_file_uploaded`), and `description`.
    - Define input parameters using `variablesService.create` (`kind: VariableKind.PARAMETER`). Specify `name`, `type`, `description`, `nullable`, etc..
    - Define output data using `variablesService.create` (`kind: VariableKind.RETURN_VALUE`). Specify `name`, `type`, `description`. These become `triggerData` for the REAction.
2. **Server: Implement Trigger Logic:** Choose the appropriate mechanism:
    - **Polling/Cron:** Add logic to the service's main `.service.ts` file, using `@Cron` for scheduling checks (like `ClockService`, `GmailService`, `TwitchService`).
    - **Webhook:** Create a dedicated Controller (like `GithubController`) with a `@Post` endpoint matching `webhook_endpoint` defined for the component.
    - **Event Listener:** Use SDKs or libraries to listen for events (like `DiscordService` listening to `messageCreate`).
3. **Server: Trigger AREA Execution:**
    - When the action condition is met:
        - Find relevant AREA configurations using `areasService.findByActionComponent(componentName)`.
        - Validate user-defined parameters (`areaParametersService.findByArea`) against the event data.
        - Use `hookStatesService.getState/setState` to prevent duplicate triggers.
        - Create an execution record: `areaExecutionsService.create({ areaId, triggerData: { ...outputVariables } })`. `triggerData` keys must match `RETURN_VALUE` variable names.
        - Call the central processor: `reactionProcessorService.processReaction(reactionComponentId, executionId, areaId)`.
4. **Clients: Update UI:**
    - Ensure the action appears in the AREA creation UI (`CreateArea.tsx`, `create_action_reaction_page.dart`).
    - Display input fields for the defined `PARAMETER` variables.

## Adding a New REAction

REActions are tasks executed when an AREA is triggered (e.g., "Send Email").

1. **Server: Define Component & Variables:**
    - In the service's initialization method (`services-initializer.service.ts`), call `componentsService.create` with `type: ComponentType.REACTION`, a unique `name` (e.g., `post_tweet`), and `description`.
    - Define input parameters using `variablesService.create` (`kind: VariableKind.PARAMETER`). These parameters can accept static values or interpolated values from the Action's `RETURN_VALUE`s (e.g., `{{commit_message}}`).
2. **Server: Implement REAction Logic:**
    - In the corresponding service (e.g., `application-server/src/<service-name>/<service-name>.service.ts` or a dedicated reactions service like `gmail-reactions.service.ts`), create a method like `async executeMyReaction(executionId: number, areaId: number)`.
    - Retrieve the execution context: `const execution = areaExecutionsService.findOne(executionId); const triggerData = execution.triggerData ?? {};`.
    - Retrieve user-configured parameters *with interpolation applied*: `const params = areaParametersService.findByAreaWithInterpolation(areaId, triggerData)`.
    - Implement the logic to perform the task (e.g., call the external API).
    - Update execution status: `areaExecutionsService.completeExecution(executionId, { resultData: ... })` or `areaExecutionsService.failExecution(executionId, errorMessage)`.
3. **Server: Register REAction Handler:**
    - Edit `application-server/src/common/reaction-processor.service.ts`.
    - Add a `case component.name:` to the `switch` statement in `processReaction`.
    - Call your newly implemented reaction method from the corresponding service instance (e.g., `await this.myNewService.executeMyReaction(executionId, areaId);`).
4. **Clients: Update UI:**
    - Ensure the reaction appears in the AREA creation UI.
    - Display input fields for the defined `PARAMETER` variables, indicating support for variable interpolation (e.g., showing available variables like `{{commit_message}}`).

## Understanding Hooks

Hooks are the mechanisms that detect Action events and trigger the workflow. We use several types:

- **Cron Jobs:** Managed by `@nestjs/schedule` for time-based Actions (see `ClockService`). Checks occur periodically (e.g., every minute).
- **Polling:** Services periodically check external APIs for changes (see `GmailService`, `TwitchService`). Often combined with `@Cron`.
- **Webhooks:** External services send HTTP POST requests to specific endpoints on our server when events occur (see `GithubController`). Requires configuring the webhook URL in the external service.
- **Event Listeners:** Persistent connections or SDKs listen for real-time events (see `DiscordService` using `discord.js` client).

**Key Components:**

- **`HookStatesService`**: Stores the last known state or last execution time for an Action within an AREA to prevent duplicate triggers.
- **`ReactionProcessorService`**: Central service that receives trigger events and routes them to the correct REAction implementation based on the AREA configuration.

## Adding an OAuth2 Provider

To support login/linking with a new OAuth2 provider:

1. **Configuration:** Add Client ID/Secret to `.env.example` and `application-server/src/config/app.config.ts`.
2. **DTO Update:** Add the provider to the `OAuthProvider` enum in `application-server/src/oauth2/dto/oauth-providers.dto.ts`. Define token response and user info interfaces/classes. Update `OAuthProviderServiceNameMap`.
3. **Core Service (`OAuth2Service`):** Implement methods in `application-server/src/oauth2/oauth2.service.ts` for:
    - `exchangeCodeForTokens`: Call the provider's token endpoint.
    - `refreshAccessToken`: Call the provider's token endpoint with a refresh token.
    - `getUserInfo`: Call the provider's user info endpoint.
    - Update `fromProviderData` and add mapping functions (like `mapDiscordUserInfo`) in `oauth2-response.dto.ts`.
4. **Auth Service (`AuthService`):** Integrate the new provider into `loginWithOAuth2` and `registerWithOAuth2` methods in `application-server/src/auth/auth.service.ts`.
5. **Service Linking (`ServicesService`):** Integrate the new provider into `linkService` and `refreshServiceToken` methods in `application-server/src/services/services.service.ts`.
6. **Clients:** Implement the client-side part of the OAuth flow (redirecting the user, handling the callback).

## Updating the Clients

When adding services, actions, or reactions:

### Web Client (`web-client/`)

- **API Calls:** Update/add functions in `src/services/api.ts` if new endpoints are needed.
- **UI Lists:** Ensure new items appear in service lists (`UserProfile.tsx`), action/reaction selectors (`CreateArea.tsx`).
- **Forms:** Add necessary input fields for new component parameters in `CreateArea.tsx`. Potentially update `src/config/componentParameters.ts` if using static config (though dynamic fetching is preferred).
- **Icons:** Add new icons to `src/lib/appIcons.tsx` if needed.

### Mobile Client (`mobile-client/`)

- **API Calls:** Update/add functions in `lib/services/service_api_service.dart` or `lib/services/area_api_service.dart`.
- **UI Lists:** Update service lists (`services_page.dart`), action/reaction selectors (`create_action_reaction_page.dart` using `ComponentSelector`).
- **Forms:** Add input fields (`CustomTextField`, `PasswordField`) for parameters in `create_action_reaction_page.dart`.

## Testing Your Contributions

Comprehensive testing is crucial.

### Unit Tests

- **Server:** Write Jest tests (`*.spec.ts`) for services, ensuring logic is correct. Mock external dependencies (APIs, database). Run: `npm test`.
- **Web Client:** Write Vitest tests (`*.test.tsx`) for components and hooks using React Testing Library. Mock API calls. Run: `npm run test:run`.
- **Mobile Client:** Write Flutter tests (`*_test.dart`) for widgets and logic. Mock API calls. Run: `flutter test`.

### Integration Tests (Server)

- Write Jest e2e tests (`*.e2e-spec.ts`) to test API endpoints and workflows using `supertest`. Run: `npm run test:e2e`.

### Manual Testing Checklist

- [ ] Does the new Service appear correctly in the UI?
- [ ] Can the user successfully authenticate/link the new Service (if OAuth2)?
- [ ] Does the new Action appear in the AREA creation flow?
- [ ] Are the Action's parameters displayed correctly?
- [ ] Does the Action trigger correctly based on external events/time?
- [ ] Are duplicate Action triggers prevented?
- [ ] Does the new REAction appear in the AREA creation flow?
- [ ] Are the REAction's parameters displayed correctly (including interpolation hints)?
- [ ] Does the REAction execute successfully when triggered?
- [ ] Is variable interpolation working correctly in REAction parameters?
- [ ] Are execution statuses (`area_executions`) updated correctly (success/failure)?
- [ ] Is error handling robust?
- [ ] Is the `/about.json` endpoint updated with the new service/components?
- [ ] Does everything work on both Web and Mobile clients?

## Code Style and Standards

- **Languages**: TypeScript (Server, Web), Dart (Mobile).
- **Formatting**: Prettier (TS), `dart format` (Dart). Config files: `.prettierrc`, `analysis_options.yaml`. Run `npm run format` / `dart format .`. Checked via Husky pre-commit hook.
- **Linting**: ESLint (TS), Flutter Analyzer (Dart). Config files: `eslint.config.mjs`/`.js`, `analysis_options.yaml`. Run `npm run lint` / `flutter analyze`. Checked via Husky pre-commit hook.
- **Naming**: Follow standard conventions (PascalCase for classes, camelCase for functions/variables in TS/Dart, snake\_case for DB columns/env vars).
- **Commits**: Adhere to [Conventional Commits](https://www.conventionalcommits.org/). Use `npm run commit` at the root for interactive guidance. Format is enforced by `commitlint` via Husky `commit-msg` hook.

## Pull Request Process

### Before Submitting

1. **Rebase:** Ensure your branch is up-to-date with the `main` branch.
2. **Test:** Run all automated tests (`npm test`, `npm run test:e2e`, `flutter test`).
3. **Lint & Format:** Run linters and formatters (`npm run lint`, `npm run format`, `flutter analyze`, `dart format .`).
4. **Manual Check:** Perform the manual testing checklist relevant to your changes.
5. **Documentation:** Update relevant READMEs or add comments if necessary. Ensure `/about.json` is correct.

### PR Template (Example)

```markdown
## Description

Adds the Spotify service, including actions for 'New Saved Track' and reactions for 'Add Track to Playlist'.

Fixes #<issue_number>

## Type of Change

- [X] New service
- [X] New action
- [X] New reaction
- [ ] Bug fix
- [ ] Documentation update

## Service Details (if applicable)

- Service Name: Spotify
- Number of Actions: 1
- Number of REActions: 1
- OAuth2 Required: Yes

## Testing

- [X] Unit tests pass (`application-server`, `web-client`, `mobile-client`)
- [X] Integration tests pass (`application-server`)
- [X] Manual testing completed (OAuth flow, AREA creation, execution)
- [X] Web client updated (Service list, AREA creation form)
- [X] Mobile client updated (Service list, AREA creation form)

## Screenshots (if applicable)

[Screenshot of Spotify in service list]
[Screenshot of Spotify action/reaction in AREA creation]

## Checklist

- [X] Code follows style guidelines
- [X] Self-review completed
- [X] Documentation updated (README, `about.json`)
- [X] Tests added/updated
- [X] No breaking changes introduced
````

### Review Process

1. **Submit PR:** Open a Pull Request from your branch to the main repository's `main` branch. Fill out the template.
2. **CI Checks:** GitHub Actions will automatically run tests, linting, and build checks. Ensure these pass.
3. **Code Review:** Maintainers will review your code for correctness, style, and adherence to the architecture.
4. **Address Feedback:** Make any requested changes.
5. **Approval & Merge:** Once approved and CI passes, your PR will be merged.

## Common Pitfalls

### Authentication Issues

❌ **Wrong**: Hardcoding tokens or secrets.
✅ **Correct**: Use environment variables (`.env`) accessed via `ConfigService`. Securely store user OAuth tokens in the `user_services` table. Implement token refresh logic (`ServicesService.refreshServiceToken`).

### Hook Performance

❌ **Wrong**: Fetching excessive data in polling actions.
✅ **Correct**: Use pagination, filters (`since`, `last_id`), or webhooks whenever possible. Efficiently query the database. Store minimal necessary state in `HookStatesService`.

### Error Handling

❌ **Wrong**: Letting external API errors crash the server or AREA execution silently fail.
✅ **Correct**: Wrap external API calls in `try...catch`. Log errors using `@nestjs/common` Logger. Update AREA execution status to `FAILED` with an error message using `areaExecutionsService.failExecution`. Provide informative error messages to the user if possible.

### State Management

❌ **Wrong**: Triggering an AREA multiple times for the same event (e.g., cron running slightly late).
✅ **Correct**: Use `HookStatesService` to store a unique identifier or timestamp for the last processed event (e.g., last email ID, last commit hash, date key for timers). Check this state before triggering `processReaction`.

-----

Thank you for contributing to AREA\!
