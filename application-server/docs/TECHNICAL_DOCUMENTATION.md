# AREA Backend Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Services Architecture](#services-architecture)
8. [Authentication & Authorization](#authentication--authorization)
9. [AREA Execution Flow](#area-execution-flow)
10. [Configuration](#configuration)
11. [Development Setup](#development-setup)
12. [Testing](#testing)

## Architecture Overview

The AREA backend is built using **NestJS**, following a modular architecture pattern. It implements an automation platform where users can create "AREAs" (Action-Reaction pairs) that trigger reactions when specific actions occur.

### Core Architecture Principles
- **Modular Design**: Each feature is encapsulated in its own module
- **Dependency Injection**: Services are injected for better testability
- **Event-Driven**: Uses cron jobs and reactive patterns
- **Database-First**: PostgreSQL with TypeORM for data persistence
- **Security-Focused**: JWT authentication with bcrypt password hashing

## Technology Stack

### Backend Framework
- **NestJS** (v11.0.1) - Node.js framework built on Express
- **TypeScript** - Type-safe development
- **Express** - Underlying HTTP server

### Database & ORM
- **PostgreSQL** - Primary database
- **TypeORM** (v0.3.27) - Object-Relational Mapping
- **Database Synchronization** - Auto-sync in development

### Authentication & Security
- **JWT** (@nestjs/jwt) - JSON Web Tokens for authentication
- **Passport** - Authentication middleware
- **bcrypt** - Password hashing

### Scheduling & Automation
- **@nestjs/schedule** - Cron jobs and task scheduling
- **Cron Expressions** - Time-based triggers

### Email Integration
- **nodemailer** (v7.0.9) - Email sending functionality
- **Gmail SMTP** - Email delivery service

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Zod** - Schema validation

## Project Structure

```
src/
├── app.module.ts                 # Root application module
├── main.ts                       # Application entry point
├── config/                       # Configuration files
├── auth/                         # Authentication module
├── users/                        # User management
├── services/                     # External service integrations
├── components/                   # AREA components (actions/reactions)
├── variables/                    # Component parameters
├── areas/                        # AREA management
├── area-parameters/              # AREA parameter values
├── area-executions/              # Execution history
├── hook-states/                  # Timer state management
├── clock/                        # Timer service
├── email/                        # Email services
├── common/                       # Shared utilities
└── user-services/                # User-service associations
```

## Core Concepts

### AREA (Action-Reaction Pair)
An AREA represents an automation rule consisting of:
- **Action Component**: A trigger (e.g., timer, webhook)
- **Reaction Component**: An effect (e.g., send email, notification)
- **Parameters**: Configuration values for both components
- **User Association**: Each AREA belongs to a specific user

### Components
Components represent available actions and reactions:
```typescript
enum ComponentType {
  ACTION = 'action',    // Triggers (timers, webhooks)
  REACTION = 'reaction' // Effects (emails, notifications)
}
```

### Variables
Variables define configurable parameters for components:
```typescript
enum VariableKind {
  PARAMETER = 'parameter', // User-configurable values
  OUTPUT = 'output'        // Generated values from actions
}

enum VariableType {
  STRING = 'string',
  EMAIL = 'email',
  NUMBER = 'number',
  BOOLEAN = 'boolean'
}
```

### Services
Services group related components (e.g., Clock, Email, GitHub):
- **Clock Service**: Timer-based actions
- **Email Service**: Email sending reactions
- **Extensible**: New services can be added dynamically

## Database Schema

### Core Entities

#### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Services
```sql
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_path VARCHAR(255),
  requires_auth BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Components
```sql
CREATE TABLE components (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES services(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'action' or 'reaction'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Areas
```sql
CREATE TABLE areas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  component_action_id INTEGER REFERENCES components(id),
  component_reaction_id INTEGER REFERENCES components(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Area Parameters
```sql
CREATE TABLE area_parameters (
  area_id INTEGER REFERENCES areas(id),
  variable_id INTEGER REFERENCES variables(id),
  value TEXT NOT NULL,
  PRIMARY KEY (area_id, variable_id)
);
```

### Relationship Overview
```
Users (1:N) Areas (N:1) Components (N:1) Services
Areas (1:N) AreaParameters (N:1) Variables
Areas (1:N) AreaExecutions
Areas (1:N) HookStates
```

## API Endpoints

### Authentication
```
POST   /auth/register          # User registration
POST   /auth/login             # User login
GET    /auth/profile           # Get user profile
PATCH  /auth/profile           # Update profile
DELETE /auth/account           # Delete account
```

### Areas Management
```
GET    /areas                  # List user's areas
POST   /areas                  # Create new area
GET    /areas/:id              # Get specific area
PATCH  /areas/:id              # Update area
DELETE /areas/:id              # Delete area
```

### Components & Services
```
GET    /services               # List all services
GET    /components             # List all components
GET    /components/:id         # Get component details
GET    /variables              # List all variables
```

### Area Parameters
```
GET    /area-parameters        # List parameters (by area_id)
POST   /area-parameters        # Set parameter value
PATCH  /area-parameters        # Update parameter
DELETE /area-parameters        # Remove parameter
```

### Execution History
```
GET    /area-executions        # List executions (by area_id)
GET    /area-executions/:id    # Get execution details
```

### Hook States (Timer Management)
```
GET    /hook-states            # List timer states
POST   /hook-states            # Create timer state
PATCH  /hook-states/:id        # Update timer state
DELETE /hook-states/:id        # Remove timer state
```

## Services Architecture

### Clock Service
Handles time-based triggers using cron jobs:

```typescript
@Injectable()
export class ClockService {
  @Cron(CronExpression.EVERY_MINUTE)
  async handleTimerTriggers(): Promise<void> {
    // Check daily and weekly timers
    // Trigger matching AREAs
  }
}
```

**Supported Timer Types:**
- **Daily Timer**: Triggers at specific time each day (HH:MM)
- **Weekly Timer**: Triggers on specific weekday and time

### Email Service
Provides email sending capabilities:

```typescript
@Injectable()
export class RealEmailService {
  private readonly transporter: Transporter;
  
  async processReaction(executionId: number, areaId: number): Promise<void> {
    // Get email parameters from area configuration
    // Send email via nodemailer + Gmail SMTP
  }
}
```

**Email Features:**
- **Real Email**: Uses nodemailer with Gmail SMTP
- **Fake Email**: Simulation for development/testing
- **Parameter Support**: Dynamic recipient, subject, body

### Reaction Processor
Routes reactions to appropriate services:

```typescript
@Injectable()
export class ReactionProcessorService {
  async processReaction(componentReactionId: number, executionId: number, areaId: number): Promise<void> {
    const component = await this.componentsService.findOne(componentReactionId);
    
    switch (component.name) {
      case 'send_email':
        await this.realEmailService.processReaction(executionId, areaId);
        break;
      case 'fake_email':
        await this.fakeEmailService.processReaction(executionId, areaId);
        break;
      // Add new reactions here
    }
  }
}
```

### Services Initializer
Automatically creates default services and components on startup:

```typescript
@Injectable()
export class ServicesInitializerService implements OnApplicationBootstrap {
  async onApplicationBootstrap(): Promise<void> {
    await this.createClockService();    // Timer components
    await this.createEmailService();   // Email components
  }
}
```

## Authentication & Authorization

### JWT Implementation
```typescript
@Injectable()
export class AuthService {
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Validate credentials
    // Generate JWT token
    // Return user data + token
  }
}
```

### Guards & Strategies
- **JWT Strategy**: Validates JWT tokens
- **Local Strategy**: Handles username/password authentication
- **JWT Guard**: Protects endpoints requiring authentication

### Password Security
- **bcrypt**: Secure password hashing
- **Salt Rounds**: Configurable via `BCRYPT_SALT_ROUNDS`
- **Password Validation**: Enforced during registration

## AREA Execution Flow

### 1. Timer Trigger
```
ClockService (Cron) → Check Active Areas → Match Time Parameters
```

### 2. Execution Creation
```
Create AreaExecution → Status: PENDING → Log Trigger Event
```

### 3. Reaction Processing
```
ReactionProcessorService → Route to Service → Execute Action
```

### 4. Result Logging
```
Update AreaExecution → Status: SUCCESS/FAILED → Log Details
```

### 5. Hook State Management
```
Update HookState → Track Last Execution → Prevent Duplicates
```

## Configuration

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=area_user
DB_PASSWORD=area_password
DB_DATABASE=area_db

# Application Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Security Configuration
BCRYPT_SALT_ROUNDS=10

# Email Configuration (Optional)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Application Config
Located in `src/config/app.config.ts`:
```typescript
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  database: {
    synchronize: !isProduction,
    logging: !isProduction,
  },
}));
```

## Development Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v12+)
- npm/yarn

### Installation
```bash
# Clone repository
git clone <repository-url>
cd application-server

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Database setup
npm run db:setup  # If available, or manually create database

# Run in development mode
npm run start:dev
```

### Database Initialization
The application automatically:
1. Creates database schema (synchronize: true in dev)
2. Initializes default services (Clock, Email)
3. Creates components and variables

## Testing

### Test Configuration
- **Unit Tests**: `npm run test`
- **E2E Tests**: `npm run test:e2e`
- **Coverage**: `npm run test:cov`

### Test Structure
```
test/
├── jest-e2e.json           # E2E test configuration
├── app.e2e-spec.ts         # Application integration tests
└── auth.e2e-spec.ts        # Authentication tests
```

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

## Extending the System

### Adding New Services
1. Create service module in `src/new-service/`
2. Implement service logic
3. Add to `services-initializer.service.ts`
4. Update `reaction-processor.service.ts` if needed
5. Register in `app.module.ts`

### Adding New Components
```typescript
// In services-initializer.service.ts
const newComponent = await this.componentsService.create({
  service_id: serviceId,
  name: 'component_name',
  type: ComponentType.REACTION,
  description: 'Component description',
  is_active: true,
});
```

### Adding New Variables
```typescript
const newVariable = await this.variablesService.create({
  component_id: componentId,
  name: 'parameter_name',
  kind: VariableKind.PARAMETER,
  type: VariableType.STRING,
  is_required: true,
});
```

## Security Considerations

### Input Validation
- **Zod**: Schema validation for environment variables
- **DTOs**: Request/response validation
- **TypeORM**: SQL injection protection

### Authentication
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Route Protection**: Guards on sensitive endpoints

### Environment Security
- **Secrets Management**: Environment variables for sensitive data
- **Production Config**: Different settings for prod/dev environments
- **Database Security**: Connection credentials via environment

---
