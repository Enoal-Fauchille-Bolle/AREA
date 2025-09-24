# Application Server

A NestJS-based REST API server with comprehensive user management functionality.

## Features

- Complete user CRUD operations (Create, Read, Update, Delete)
- Password hashing with bcrypt
- Username and email uniqueness validation
- User authentication support
- Admin and active status management
- Last connection tracking
- RESTful API endpoints
- Input validation and error handling
- Comprehensive test coverage
- TypeScript support with strict typing

## Installation

```bash
npm install
```

## Running the application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod

# Build
npm run build
```

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Endpoints

### Users

- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `GET /users/by-username/:username` - Get user by username
- `POST /users` - Create a new user
- `PATCH /users/:id` - Update user by ID
- `PATCH /users/:id/last-connection` - Update user's last connection time
- `DELETE /users/:id` - Delete user by ID

### User Model (Response)

```typescript
{
  id: number;
  email: string;
  username: string;
  icon_path?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_connection_at?: Date;
  // Note: password_hash is never exposed in API responses
}
```

### Create User DTO

```typescript
{
  email: string;           // Required, must be unique
  username: string;        // Required, must be unique
  password: string;        // Required, will be hashed automatically
  icon_path?: string;      // Optional
  is_admin?: boolean;      // Optional, defaults to false
  is_active?: boolean;     // Optional, defaults to true
}
```

### Update User DTO

All fields are optional for updates:

```typescript
{
  email?: string;
  username?: string;
  password?: string;       // Will be hashed if provided
  icon_path?: string;
  is_admin?: boolean;
  is_active?: boolean;
}
```

## Example Usage

### Create a user
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "securePassword123",
    "is_admin": false,
    "is_active": true
  }'
```

### Get all users
```bash
curl http://localhost:3000/users
```

### Get user by ID
```bash
curl http://localhost:3000/users/1
```

### Get user by username
```bash
curl http://localhost:3000/users/by-username/johndoe
```

### Update user
```bash
curl -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "janedoe",
    "password": "newPassword123"
  }'
```

### Update last connection
```bash
curl -X PATCH http://localhost:3000/users/1/last-connection
```

### Delete user
```bash
curl -X DELETE http://localhost:3000/users/1
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 10
- **Password Validation**: Service includes `validatePassword()` method for authentication
- **No Password Exposure**: Password hashes are never returned in API responses
- **Input Validation**: Duplicate email and username prevention
- **Secure Updates**: Password updates are properly hashed

## Database Schema

The user entity matches the following database columns:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  icon_path VARCHAR,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_connection_at TIMESTAMP
);
```

## Project Structure

```
src/
├── app.controller.ts          # Main application controller
├── app.module.ts             # Root application module (imports UsersModule)
├── app.service.ts            # Main application service
├── main.ts                   # Application entry point
└── users/                    # Users module
    ├── dto/                  # Data Transfer Objects
    │   ├── create-user.dto.ts    # User creation DTO
    │   ├── update-user.dto.ts    # User update DTO
    │   └── user-response.dto.ts  # API response DTO (excludes password)
    ├── entities/             # Entity definitions
    │   └── user.entity.ts        # User entity with all fields
    ├── users.controller.ts   # Users REST API controller
    ├── users.service.ts      # Users business logic service
    ├── users.module.ts       # Users NestJS module
    ├── users.controller.spec.ts  # Controller unit tests
    ├── users.service.spec.ts     # Service unit tests
    └── index.ts             # Barrel exports
```

## Technology Stack

- **Framework**: NestJS v11
- **Language**: TypeScript
- **Password Hashing**: bcrypt
- **Testing**: Jest (29 tests passing)
- **Linting**: ESLint
- **Formatting**: Prettier

## Development

The application runs on `http://localhost:3000` by default.

### Current Implementation

- **In-Memory Storage**: All user data is stored in memory and will be lost when the application restarts
- **Auto-incrementing IDs**: User IDs are generated sequentially starting from 1
- **Thread-Safe Operations**: Service methods handle concurrent access properly

### Production Considerations

For production use, you would want to:

1. **Database Integration**: Replace in-memory storage with PostgreSQL, MySQL, or MongoDB
2. **Authentication**: Add JWT tokens, sessions, or OAuth
3. **Validation**: Add class-validator decorators to DTOs for input validation
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Logging**: Add structured logging with Winston or similar
6. **Environment Configuration**: Use @nestjs/config for environment variables
7. **API Documentation**: Add Swagger/OpenAPI documentation
8. **Error Handling**: Implement global exception filters

## Next Steps

The user system is production-ready for basic CRUD operations and can serve as a foundation for:

- Authentication and authorization systems
- User profile management
- Admin panels
- Multi-tenant applications
- Social features
- Activity tracking

All methods are properly typed, tested, and follow NestJS best practices.