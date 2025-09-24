# AREA API Endpoints

Go back to the [Application Server Documentation](./APPLICATION_SERVER.md).

## Table of Contents

- [Authentication](#authentication)
  - [POST /auth/login](#post-authlogin)
  - [POST /auth/login-oauth2](#post-authlogin-oauth2)
  - [POST /auth/register](#post-authregister)
  - [GET /auth/me](#get-authme)
  - [PATCH /auth/me](#patch-authme)
  - [DELETE /auth/me](#delete-authme)
- [Areas](#areas)
  - [GET /areas](#get-areas)
  - [GET /areas/:id](#get-areasid)
  - [POST /areas](#post-areas)
  - [PATCH /areas/:id](#patch-areasid)
  - [DELETE /areas/:id](#delete-areasid)
- [Services](#services)
  - [GET /services](#get-services)
  - [GET /services/:id](#get-servicesid)
  - [GET /services/:id/actions](#get-servicesidactions)
  - [GET /services/:id/reactions](#get-servicesidreactions)
  - [GET /services/:id/components](#get-servicesidcomponents)
  - [GET /services/me](#get-servicesme)
  - [POST /services/:id/link](#post-servicesidlink)
  - [DELETE /services/:id/unlink](#delete-servicesidunlink)
- [About](#about)
  - [GET /about.json](#get-aboutjson)
- [Admin](#admin)
  - [GET /admin/kpi](#get-adminkpi)
  - [GET /admin/users](#get-adminusers)
  - [GET /admin/users/:id](#get-adminusersid)
  - [PATCH /admin/users/:id](#patch-adminusersid)
  - [DELETE /admin/users/:id](#delete-adminusersid)
  - [DELETE /admin/users/:id/services/:id](#delete-adminusersidservicesid)
  - [GET /admin/areas](#get-adminareas)
  - [GET /admin/areas/:id](#get-adminareasid)
  - [PATCH /admin/areas/:id](#patch-adminareasid)
  - [DELETE /admin/areas/:id](#delete-adminareasid)
  - [PATCH /admin/services/:id](#patch-adminservicesid)
  - [PATCH /admin/components/:id](#patch-admincomponentsid)

---

## Authentication

### POST /auth/login

**Description:** Authenticate a user and return a JWT token.

**Access:** 🌐 Public

**Request Body:**

- `email` (string, required): User's email address.
- `password` (string, required): User's password.

**Response:**

- `token` (string): JWT token for authenticated requests.

**Status codes:**

- `200 OK`: Successful authentication.
- `400 Bad Request`: Missing or invalid parameters.
- `401 Unauthorized`: Invalid email or password.

---

### POST /auth/login-oauth2

**Description:** Authenticate a user using OAuth2 and return a JWT token.

**Access:** 🌐 Public

**Request Body:**

- `service` (string, required): OAuth2 service (e.g., "Google", "Discord").
- `code` (string, required): Authorization code from the OAuth2 provider.

**Response:**

- `token` (string): JWT token for authenticated requests.

**Status codes:**

- `200 OK`: Successful authentication.
- `400 Bad Request`: Missing or invalid parameters.
- `401 Unauthorized`: Invalid authorization code.

---

### POST /auth/register

**Description:** Register a new user.

**Access:** 🌐 Public

**Request Body:**

- `email` (string, required): User's email address.
- `username` (string, required): User's username.
- `password` (string, required): User's password.

**Response:**

- `token` (string): JWT token for authenticated requests.

**Status codes:**

- `201 Created`: Successful registration.
- `400 Bad Request`: Missing or invalid parameters.
- `409 Conflict`: Email/username already in use.

### POST /auth/register-oauth2

**Description:** Register a new user using OAuth2.

**Access:** 🌐 Public

**Request Body:**

- `service` (string, required): OAuth2 service (e.g., "Google", "Discord").
- `code` (string, required): Authorization code from the OAuth2 provider.

**Response:**

- `token` (string): JWT token for authenticated requests.

**Status codes:**

- `201 Created`: Successful registration.
- `400 Bad Request`: Missing or invalid parameters.
- `401 Unauthorized`: Invalid authorization code.
- `409 Conflict`: Email/username already in use.
- 
---

### GET /auth/me

**Description:** Retrieve the authenticated user's profile.

**Access:** 🔒 Authenticated

**Response:**

- `id` (uuid): User's unique identifier.
- `email` (string): User's email address.
- `username` (string): User's username.
- `icon_url` (string): URL to the user's icon/avatar.
- `is_admin` (boolean): Whether the user has admin privileges.
- `created_at` (timestamp): Timestamp of user creation.
- `updated_at` (timestamp): Timestamp of last user update.
- `last_connection_at` (timestamp): Timestamp of last user connection.

**Status codes:**

- `200 OK`: Successful retrieval of user profile.
- `401 Unauthorized`: Invalid or missing JWT token.

### PATCH /auth/me

**Description:** Update the authenticated user's profile.

**Access:** 🔒 Authenticated

**Request Body:**

- `email` (string, optional): User's email address.
- `username` (string, optional): User's username.
- `password` (string, optional): User's password.
- `icon_url` (string, optional): URL to the user's icon/avatar (can be a data URL)

**Response:**

- `id` (uuid): User's unique identifier.
- `email` (string): User's email address.
- `username` (string): User's username.
- `icon_url` (string): URL to the user's icon/avatar.
- `is_admin` (boolean): Whether the user has admin privileges.
- `created_at` (timestamp): Timestamp of user creation.
- `updated_at` (timestamp): Timestamp of last user update.
- `last_connection_at` (timestamp): Timestamp of last user connection.

**Status codes:**

- `200 OK`: Successful update of user profile.
- `400 Bad Request`: Missing or invalid ID.
- `401 Unauthorized`: Invalid or missing JWT token.
- `409 Conflict`: Email/username already in use.

---

### DELETE /auth/me

**Description:** Delete the authenticated user's account.

**Access:** 🔒 Authenticated

**Response:**

*No response body.*

**Status codes:**

- `204 No Content`: Successful deletion of user account.
- `401 Unauthorized`: Invalid or missing JWT token.

---

## Areas

### GET /areas

**Description:** Retrieve a list of all your areas.

**Access:** 🔒 Authenticated

**Response:**

- `areas` (array): List of area objects.
  - `id` (uuid): Area's unique identifier.
  - `name` (string): Area's name.
  - `services` (array): List of connected services.
    - `name` (string): Service name.
    - `icon_url` (string): URL to the service icon.
  - `is_active` (boolean): Whether the area is active.
  - `created_at` (timestamp): Timestamp of area creation.
  - `updated_at` (timestamp): Timestamp of last area update.
  - `last_triggered_at` (string|null): Timestamp of last area trigger, or null if never triggered.
  - `triggered_count` (integer): Number of times the area has been triggered.

**Status codes:**

- `200 OK`: Successful retrieval of areas.
- `401 Unauthorized`: Invalid or missing JWT token.

---

### GET /areas/:id

**Description:** Retrieve a specific area by ID.

**Access:** 🔒 Authenticated

**Response:**

- `id` (uuid): Area's unique identifier.
- `name` (string): Area's name.
- `description` (string): Area's description.
- `services` (array): List of connected services.
  - `name` (string): Service name.
  - `icon_url` (string): URL to the service icon.
- `components` (array): List of components in the area.
  - `id` (uuid): Component's unique identifier.
  - `name` (string): Component name.
  - `description` (string): Component description.
  - `type` (string): Component type ("action" or "reaction").
  - `service` (object): Service associated with the component.
    - `name` (string): Service name.
    - `icon_url` (string): URL to the service icon.
  - `variables` (array): Component variables.
    - `id` (uuid): Variable's unique identifier.
    - `name` (string): Variable name.
    - `description` (string): Variable description.
    - `kind` (string): Variable kind ("input" or "output").
    - `type` (string): Variable type ("string", "number", "boolean", etc.).
    - `value` (string): Variable value.
    - `optional` (boolean): Whether the variable is optional.
    - `validation_regex` (string|null): Regex for variable validation, or null if none.
    - `placeholder` (string): Placeholder text for the variable, or null if none.
    - `display_order` (integer): Order of display for the variable.
- `is_active` (boolean): Whether the area is active.
- `created_at` (timestamp): Timestamp of area creation.
- `updated_at` (timestamp): Timestamp of last area update.
- `last_triggered_at` (string|null): Timestamp of last area trigger, or null if never triggered.
- `triggered_count` (integer): Number of times the area has been triggered.

**Status codes:**

- `200 OK`: Successful retrieval of area.
- `401 Unauthorized`: Invalid or missing JWT token.
- `404 Not Found`: Area not found.

---

### POST /areas

**Description:** Create a new area.

**Access:** 🔒 Authenticated

**Request Body:**

- `name` (string, required): Area's name.
- `description` (string, optional): Area's description.
- `components` (array, required): List of components in the area.
  - `id` (uuid, optional): Component's unique identifier (for existing components).
  - `variables` (array, required): Component variables.
    - `name` (string, required): Variable name.
    - `value` (string, required): Variable value.
- `is_active` (boolean, optional): Whether the area is active (default: true).

**Response:**

- `id` (uuid): Area's unique identifier.
- `name` (string): Area's name.
- `description` (string): Area's description.
- `services` (array): List of connected services.
  - `name` (string): Service name.
  - `icon_url` (string): URL to the service icon.
- `components` (array): List of components in the area.
  - `id` (uuid): Component's unique identifier.
  - `name` (string): Component name.
  - `description` (string): Component description.
  - `type` (string): Component type ("action" or "reaction").
  - `service` (object): Service associated with the component.
    - `name` (string): Service name.
    - `icon_url` (string): URL to the service icon.
  - `variables` (array): Component variables.
    - `id` (uuid): Variable's unique identifier.
    - `name` (string): Variable name.
    - `description` (string): Variable description.
    - `kind` (string): Variable kind ("input" or "output").
    - `type` (string): Variable type ("string", "number", "boolean", etc.).
    - `value` (string): Variable value.
    - `optional` (boolean): Whether the variable is optional.
    - `validation_regex` (string|null): Regex for variable validation, or null if none.
    - `placeholder` (string): Placeholder text for the variable, or null if none.
    - `display_order` (integer): Order of display for the variable.
- `is_active` (boolean): Whether the area is active.
- `created_at` (timestamp): Timestamp of area creation.
- `updated_at` (timestamp): Timestamp of last area update.
- `last_triggered_at` (string|null): Timestamp of last area trigger, or null if never triggered.
- `triggered_count` (integer): Number of times the area has been triggered.

**Status codes:**

- `201 Created`: Successful creation of area.
- `400 Bad Request`: Missing or invalid parameters.
- `401 Unauthorized`: Invalid or missing JWT token.

---

### PATCH /areas/:id

**Description:** Update a specific area by ID.

**Access:** 🔒 Authenticated

**Request Body:**

- `name` (string, optional): Area's name.
- `description` (string, optional): Area's description.
- `components` (array, optional): List of components in the area.
  - `id` (uuid, required): Component's unique identifier (for existing components).
  - `variables` (array, required): Component variables.
    - `name` (string, required): Variable name.
    - `value` (string, required): Variable value.
- `is_active` (boolean, optional): Whether the area is active.

**Response:**

- `id` (uuid): Area's unique identifier.
- `name` (string): Area's name.
- `description` (string): Area's description.
- `services` (array): List of connected services.
  - `name` (string): Service name.
  - `icon_url` (string): URL to the service icon.
- `components` (array): List of components in the area.
  - `id` (uuid): Component's unique identifier.
  - `name` (string): Component name.
  - `description` (string): Component description.
  - `type` (string): Component type ("action" or "reaction").
  - `service` (object): Service associated with the component.
    - `name` (string): Service name.
    - `icon_url` (string): URL to the service icon.
  - `variables` (array): Component variables.
    - `id` (uuid): Variable's unique identifier.
    - `name` (string): Variable name.
    - `description` (string): Variable description.
    - `kind` (string): Variable kind ("input" or "output").
    - `type` (string): Variable type ("string", "number", "boolean", etc.).
    - `value` (string): Variable value.
    - `optional` (boolean): Whether the variable is optional.
    - `validation_regex` (string|null): Regex for variable validation, or null if none.
    - `placeholder` (string): Placeholder text for the variable, or null if none.
    - `display_order` (integer): Order of display for the variable.
- `is_active` (boolean): Whether the area is active.
- `created_at` (timestamp): Timestamp of area creation.
- `updated_at` (timestamp): Timestamp of last area update.
- `last_triggered_at` (string|null): Timestamp of last area trigger, or null if never triggered.
- `triggered_count` (integer): Number of times the area has been triggered.

**Status codes:**

- `200 OK`: Successful update of area.
- `400 Bad Request`: Missing or invalid parameters.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Area not found.

---

### DELETE /areas/:id

**Description:** Delete a specific area by ID.

**Access:** 🔒 Authenticated

**Response:**

*No response body.*

**Status codes:**

- `204 No Content`: Successful deletion of area.
- `400 Bad Request`: Invalid area ID.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Area not found.

---

## Services

### GET /services

**Description:** Retrieve a list of all available services.

**Access:** 🔒 Authenticated

**Response:**

- `services` (array): List of services.
  - `id` (uuid): Service unique identifier.
  - `name` (string): Service name.
  - `description` (string): Service description.
  - `icon_url` (string): URL to the service icon.
  - `requires_auth` (boolean): Whether the service requires OAuth2 authentication.
  - `is_active` (boolean): Whether the service is active.

**Status codes:**

- `200 OK`: Successful retrieval of services.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.

---

### GET /services/:id

**Description:** Retrieve information about a specific service.

**Access:** 🔒 Authenticated

**Response:**

- `id` (uuid): Service unique identifier.
- `name` (string): Service name.
- `description` (string): Service description.
- `icon_url` (string): URL to the service icon.
- `requires_auth` (boolean): Whether the service requires OAuth2 authentication.
- `is_active` (boolean): Whether the service is active.

**Status codes:**

- `200 OK`: Successful retrieval of service information.
- `401 Unauthorized`: Invalid or missing JWT token.
- `404 Not Found`: Service not found.

---

### GET /services/:id/actions

**Description:** Retrieve available actions for a specific service.

**Access:** 🔒 Authenticated

**Response:**

- `actions` (array): List of available actions for the service.
  - `id` (uuid): Action unique identifier.
  - `name` (string): Action name.
  - `description` (string): Action description.
  - `variables` (array): List of variables for the action.
    - `id` (uuid): Variable unique identifier.
    - `name` (string): Variable name.
    - `description` (string): Variable description.
    - `kind` (string): Variable kind ("input" or "output").
    - `type` (string): Variable type ("string", "number", "boolean", etc.).
    - `optional` (boolean): Whether the variable is optional.
    - `validation_regex` (string|null): Regex for variable validation, or null if none.
    - `placeholder` (string): Placeholder text for the variable, or null if none.
    - `display_order` (integer): Order of display for the variable.

**Status codes:**

- `200 OK`: Successful retrieval of service actions.
- `401 Unauthorized`: Invalid or missing JWT token.
- `404 Not Found`: Service not found.

---

### GET /services/:id/reactions

**Description:** Retrieve available reactions for a specific service.

**Access:** 🔒 Authenticated

**Response:**

- `reactions` (array): List of available reactions for the service.
  - `id` (uuid): Reaction unique identifier.
  - `name` (string): Reaction name.
  - `description` (string): Reaction description.
  - `variables` (array): List of variables for the reaction.
    - `id` (uuid): Variable unique identifier.
    - `name` (string): Variable name.
    - `description` (string): Variable description.
    - `kind` (string): Variable kind ("input" or "output").
    - `type` (string): Variable type ("string", "number", "boolean", etc.).
    - `optional` (boolean): Whether the variable is optional.
    - `validation_regex` (string|null): Regex for variable validation, or null if none.
    - `placeholder` (string): Placeholder text for the variable, or null if none.
    - `display_order` (integer): Order of display for the variable.

**Status codes:**

- `200 OK`: Successful retrieval of service reactions.
- `401 Unauthorized`: Invalid or missing JWT token.
- `404 Not Found`: Service not found.

---

### GET /services/:id/components

**Description:** Retrieve available components (actions and reactions) for a specific service.

**Access:** 🔒 Authenticated

**Response:**

- `components` (array): List of available components for the service.
  - `id` (uuid): Component unique identifier.
  - `name` (string): Component name.
  - `description` (string): Component description.
  - `kind` (string): Component kind ("action" or "reaction").
  - `variables` (array): List of variables for the component.
    - `id` (uuid): Variable unique identifier.
    - `name` (string): Variable name.
    - `description` (string): Variable description.
    - `kind` (string): Variable kind ("input" or "output").
    - `type` (string): Variable type ("string", "number", "boolean", etc.).
    - `optional` (boolean): Whether the variable is optional.
    - `validation_regex` (string|null): Regex for variable validation, or null if none.
    - `placeholder` (string): Placeholder text for the variable, or null if none.
    - `display_order` (integer): Order of display for the variable.

**Status codes:**

- `200 OK`: Successful retrieval of service components.
- `401 Unauthorized`: Invalid or missing JWT token.
- `404 Not Found`: Service not found.

---

### GET /services/me

**Description:** Retrieve services linked to the authenticated user.

**Access:** 🔒 Authenticated

**Response:**

- `services` (array): List of services linked to the user.
  - `id` (uuid): Service unique identifier.
  - `name` (string): Service name.
  - `description` (string): Service description.
  - `icon_url` (string): URL to the service icon.
  - `requires_auth` (boolean): Whether the service requires OAuth2 authentication.
  - `is_active` (boolean): Whether the service is active.
  - `created_at` (timestamp): Timestamp of when the service was linked.

**Status codes:**

- `200 OK`: Successful retrieval of linked services.
- `401 Unauthorized`: Invalid or missing JWT token.

---

### POST /services/:id/link

**Description:** Link a service to the authenticated user.

**Access:** 🔒 Authenticated

**Request Body:**

- `code` (string, required if service requires OAuth2): Exchange code or token for service authentication.

**Response:**

*No response body.*

**Status codes:**

- `204 No Content`: Service successfully linked.
- `400 Bad Request`: Invalid parameters.
- `401 Unauthorized`: Invalid or missing JWT token.
- `404 Not Found`: Service not found.

---

### DELETE /services/:id/unlink

**Description:** Unlink a service from the authenticated user.

**Access:** 🔒 Authenticated

**Response:**

*No response body.*

**Status codes:**

- `204 No Content`: Service successfully unlinked.
- `401 Unauthorized`: Invalid or missing JWT token.
- `404 Not Found`: Service not found.

---

## About

### GET /about.json

**Description:** Retrieve information about the AREA application and available services.

**Access:** 🌐 Public

**Response:**

- `client` (object): Client information.
  - `host` (string): Server host address.
- `server` (object): Server information.
  - `current_time` (number): Current server timestamp.
  - `services` (array): List of available services with their actions and reactions.
    - `name` (string): Service name.
    - `actions` (array): List of actions for the service.
      - `name` (string): Action name.
      - `description` (string): Action description.
    - `reactions` (array): List of reactions for the service.
      - `name` (string): Reaction name.
      - `description` (string): Reaction description.

**Status codes:**

- `200 OK`: Successful retrieval of about information.

---

## Admin

### GET /admin/kpi

**Description:** Retrieve key performance indicators for the application.

**Access:** 🛡️ Admin

**Response:**

- `total_users` (integer): Total number of registered users.
- `active_users` (integer): Number of active users in the last 30 days.
- `total_areas` (integer): Total number of areas created.
- `active_areas` (integer): Number of areas that have been triggered in the last 30 days.
- `total_services` (integer): Total number of services available.
- `linked_services` (integer): Total number of services linked by users.
- `total_triggers` (integer): Total number of area triggers.
- `total_actions` (integer): Total number of actions used in areas.
- `total_reactions` (integer): Total number of reactions used in areas.
- `average_areas_per_user` (float): Average number of areas per user.
- `average_triggers_per_area` (float): Average number of triggers per area.
- `average_services_per_user` (float): Average number of services linked per user.
- `services` (array): List of all services with their usage statistics.
  - `name` (string): Service name.
  - `linked_count` (integer): Number of users who have linked this service.
  - `used_in_areas_count` (integer): Number of areas using this service.
  - `actions_count` (integer): Total number of actions from this service used in areas.
  - `reactions_count` (integer): Total number of reactions from this service used in areas.
  - `components`: (array): List of components from this service used in areas.
    - `name` (string): Component name.
    - `type` (string): Component type ("action" or "reaction").
    - `usage_count` (integer): Number of times this component is used in areas.
- `monthly_growth` (array): User growth statistics for the past 12 months.
  - `month` (string): Month in "YYYY-MM" format.
  - `new_users` (integer): Number of new users registered in that month.
  - `active_users` (integer): Number of users active in that month.
  - `total_users` (integer): Total number of users by the end of that month.
  - `new_areas` (integer): Number of new areas created in that month.
  - `total_areas` (integer): Total number of areas by the end of that month.
  - `new_linked_services` (integer): Number of new services linked in that month.
  - `total_linked_services` (integer): Total number of linked services by the end of that month.
  - `new_triggers` (integer): Number of area triggers in that month.
  - `total_triggers` (integer): Total number of area triggers by the end of that month.
  - `new_actions` (integer): Number of actions used in areas in that month.
  - `total_actions` (integer): Total number of actions used in areas by the end of that month.
  - `new_reactions` (integer): Number of reactions used in areas in that month.
  - `total_reactions` (integer): Total number of reactions used in areas by the end of that month.

**Status codes:**

- `200 OK`: Successful retrieval of KPI data.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.

---

### GET /admin/users

**Description:** Retrieve a list of all users.

**Access:** 🛡️ Authenticated as Admin

**Response:**

- `users` (array): List of user objects.
  - `id` (uuid): User's unique identifier.
  - `email` (string): User's email address.
  - `username` (string): User's username.
  - `icon_url` (string): URL to the user's icon/avatar.
  - `is_admin` (boolean): Whether the user has admin privileges.
  - `is_active` (boolean): Whether the user account is active.
  - `created_at` (timestamp): Timestamp of user creation.
  - `updated_at` (timestamp): Timestamp of last user update.
  - `last_connection_at` (timestamp): Timestamp of last user connection.

**Status codes:**

- `200 OK`: Successful retrieval of user list.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.

---

### GET /admin/users/:id

**Description:** Retrieve a specific user's profile by ID.

**Access:** 🛡️ Authenticated as Admin

**Response:**

- `id` (uuid): User's unique identifier.
- `email` (string): User's email address.
- `username` (string): User's username.
- `icon_url` (string): URL to the user's icon/avatar.
- `is_admin` (boolean): Whether the user has admin privileges.
- `is_active` (boolean): Whether the user account is active.
- `created_at` (timestamp): Timestamp of user creation.
- `updated_at` (timestamp): Timestamp of last user update.
- `last_connection_at` (timestamp): Timestamp of last user connection.
- `areas` (array): List of areas created by the user.
  - `id` (uuid): Area's unique identifier.
  - `name` (string): Area's name.
  - `is_active` (boolean): Whether the area is active.
  - `created_at` (timestamp): Timestamp of area creation.
  - `updated_at` (timestamp): Timestamp of last area update.
  - `last_triggered_at` (string|null): Timestamp of last area trigger, or null if never triggered.
  - `triggered_count` (integer): Number of times the area has been triggered.
- `services` (array): List of services linked by the user.
  - `id` (uuid): Service unique identifier.
  - `name` (string): Service name.
  - `description` (string): Service description.
  - `icon_url` (string): URL to the service icon.
  - `requires_auth` (boolean): Whether the service requires OAuth2 authentication.
  - `is_active` (boolean): Whether the service is active.
  - `created_at` (timestamp): Timestamp of when the service was linked.

**Status codes:**

- `200 OK`: Successful retrieval of user profile.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: User not found.

---

### PATCH /admin/users/:id

**Description:** Update a specific user's profile by ID.

**Access:** 🛡️ Authenticated as Admin

**Request Body:**

- `email` (string, optional): User's email address.
- `username` (string, optional): User's username.
- `password` (string, optional): User's password.
- `icon_url` (string, optional): URL to the user's icon/avatar.
- `is_active` (boolean, optional): Whether the user account is active. (Admin only)
- `is_admin` (boolean, optional): Whether the user has admin privileges. (Admin only)

**Response:**

- `id` (uuid): User's unique identifier.
- `email` (string): User's email address.
- `username` (string): User's username.
- `icon_url` (string): URL to the user's icon/avatar.
- `is_admin` (boolean): Whether the user has admin privileges.
- `is_active` (boolean): Whether the user account is active.
- `created_at` (timestamp): Timestamp of user creation.
- `updated_at` (timestamp): Timestamp of last user update.
- `last_connection_at` (timestamp): Timestamp of last user connection.

**Status codes:**

- `200 OK`: Successful update of user profile.
- `400 Bad Request`: Missing or invalid ID.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: User not found.
- `409 Conflict`: Email/username already in use.

---

### DELETE /admin/users/:id

**Description:** Delete a specific user by ID.

**Access:** 🛡️ Authenticated as Admin

**Response:**

*No response body.*

**Status codes:**

- `204 No Content`: Successful deletion of user.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: User not found.

---

### DELETE /admin/users/:id/services/:id

**Description:** Unlink a specific service from a user by ID.

**Access:** 🛡️ Authenticated as Admin

**Response:**

*No response body.*

**Status codes:**

- `204 No Content`: Successful un-linking of service from user.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: User or service not found.

---

### GET /admin/areas

**Description:** Retrieve a list of all areas in the system.

**Access:** 🛡️ Authenticated as Admin

**Response:**

- `areas` (array): List of area objects.
  - `id` (uuid): Area's unique identifier.
  - `name` (string): Area's name.
  - `owner` (object): Owner of the area.
    - `id` (uuid): User's unique identifier.
    - `email` (string): User's email address.
    - `username` (string): User's username.
    - `icon_url` (string): URL to the user's icon/avatar.
  - `services` (array): List of connected services.
    - `name` (string): Service name.
    - `icon_url` (string): URL to the service icon.
  - `is_active` (boolean): Whether the area is active.
  - `created_at` (timestamp): Timestamp of area creation.
  - `updated_at` (timestamp): Timestamp of last area update.
  - `last_triggered_at` (string|null): Timestamp of last area trigger, or null if never triggered.
  - `triggered_count` (integer): Number of times the area has been triggered.

**Status codes:**

- `200 OK`: Successful retrieval of areas.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.

---

### GET /admin/areas/:id

**Description:** Retrieve a specific area by ID.

**Access:** 🛡️ Authenticated as Admin

**Response:**

- `id` (uuid): Area's unique identifier.
- `name` (string): Area's name.
- `description` (string): Area's description.
- `owner` (object): Owner of the area.
  - `id` (uuid): User's unique identifier.
  - `email` (string): User's email address.
  - `username` (string): User's username.
  - `icon_url` (string): URL to the user's icon/avatar.
- `services` (array): List of connected services.
  - `name` (string): Service name.
  - `icon_url` (string): URL to the service icon.
- `components` (array): List of components in the area.
  - `id` (uuid): Component's unique identifier.
  - `name` (string): Component name.
  - `description` (string): Component description.
  - `type` (string): Component type ("action" or "reaction").
  - `service` (object): Service associated with the component.
    - `name` (string): Service name.
    - `icon_url` (string): URL to the service icon.
  - `variables` (array): Component variables.
    - `name` (string): Variable name.
    - `description` (string): Variable description.
    - `kind` (string): Variable kind ("input" or "output").
    - `type` (string): Variable type ("string", "number", "boolean", etc.).
    - `value` (string): Variable value.
    - `optional` (boolean): Whether the variable is optional.
    - `validation_regex` (string|null): Regex for variable validation, or null if none.
    - `placeholder` (string): Placeholder text for the variable, or null if none.
    - `display_order` (integer): Order of display for the variable.
- `is_active` (boolean): Whether the area is active.
- `created_at` (timestamp): Timestamp of area creation.
- `updated_at` (timestamp): Timestamp of last area update.
- `last_triggered_at` (string|null): Timestamp of last area trigger, or null if never triggered.
- `triggered_count` (integer): Number of times the area has been triggered.

**Status codes:**

- `200 OK`: Successful retrieval of area.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Area not found.

---

### PATCH /admin/areas/:id

**Description:** Update a specific area by ID.

**Access:** 🛡️ Authenticated as Admin

**Request Body:**

- `name` (string, optional): Area's name.
- `description` (string, optional): Area's description.
- `owner_id` (uuid, optional): User ID to transfer area ownership.
- `components` (array, optional): List of components in the area.
  - `id` (uuid, required): Component's unique identifier (for existing components).
  - `variables` (array, required): Component variables.
    - `name` (string, required): Variable name.
    - `value` (string, required): Variable value.
- `is_active` (boolean, optional): Whether the area is active.

**Response:**

- `id` (uuid): Area's unique identifier.
- `name` (string): Area's name.
- `description` (string): Area's description.
- `owner` (object): Owner of the area.
  - `id` (uuid): User's unique identifier.
  - `email` (string): User's email address.
  - `username` (string): User's username.
  - `icon_url` (string): URL to the user's icon/avatar.
- `services` (array): List of connected services.
  - `name` (string): Service name.
  - `icon_url` (string): URL to the service icon.
- `components` (array): List of components in the area.
  - `id` (uuid): Component's unique identifier.
  - `name` (string): Component name.
  - `description` (string): Component description.
  - `type` (string): Component type ("action" or "reaction").
  - `service` (object): Service associated with the component.
    - `name` (string): Service name.
    - `icon_url` (string): URL to the service icon.
  - `variables` (array): Component variables.
    - `name` (string): Variable name.
    - `description` (string): Variable description.
    - `kind` (string): Variable kind ("input" or "output").
    - `type` (string): Variable type ("string", "number", "boolean", etc.).
    - `value` (string): Variable value.
    - `optional` (boolean): Whether the variable is optional.
    - `validation_regex` (string|null): Regex for variable validation, or null if none.
    - `placeholder` (string): Placeholder text for the variable, or null if none.
    - `display_order` (integer): Order of display for the variable.
- `is_active` (boolean): Whether the area is active.
- `created_at` (timestamp): Timestamp of area creation.
- `updated_at` (timestamp): Timestamp of last area update.
- `last_triggered_at` (string|null): Timestamp of last area trigger, or null if never triggered.
- `triggered_count` (integer): Number of times the area has been triggered.

**Status codes:**

- `200 OK`: Successful update of area.
- `400 Bad Request`: Missing or invalid parameters.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Area not found.

---

### DELETE /admin/areas/:id

**Description:** Delete a specific area by ID.

**Access:** 🛡️ Authenticated as Admin

**Response:**

*No response body.*

**Status codes:**

- `204 No Content`: Successful deletion of area.
- `401 Unauthorized`: Invalid or missing JWT token.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Area not found.

### PATCH /admin/services/:id

**Description:** Update a specific service by ID.

**Access:** 🛡️ Authenticated as Admin

**Request Body:**

- `name` (string, optional): Service name.
- `description` (string, optional): Service description.
- `icon_url` (string, optional): URL to the service icon.
- `is_active` (boolean, optional): Whether the service is active.

**Response:**

- `id` (uuid): Service unique identifier.
- `name` (string): Service name.
- `description` (string): Service description.
- `icon_url` (string): URL to the service icon.
- `requires_auth` (boolean): Whether the service requires OAuth2 authentication.
- `is_active` (boolean): Whether the service is active.

---

### PATCH /admin/components/:id

**Description:** Update a specific component by ID.

**Access:** 🛡️ Authenticated as Admin

**Request Body:**

- `name` (string, optional): Component name.
- `description` (string, optional): Component description.
- `is_active` (boolean, optional): Whether the component is active.
- `webhook_endpoint` (string, optional): Webhook endpoint URL (for action components).
- `polling_interval` (integer, optional): Polling interval in seconds (for action components).

**Response:**

- `id` (uuid): Component unique identifier.
- `name` (string): Component name.
- `description` (string): Component description.
- `type` (string): Component type ("action" or "reaction").
- `is_active` (boolean): Whether the component is active.
- `webhook_endpoint` (string|null): Webhook endpoint URL, or null if not applicable.
- `polling_interval` (integer|null): Polling interval in seconds, or null if not applicable.
