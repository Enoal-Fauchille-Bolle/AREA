import { NestFactory } from '@nestjs/core';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AREA API Documentation')
    .setDescription(
      'Complete API documentation for the AREA (Action-Reaction) application server. ' +
        'This API allows you to create automations by connecting actions (triggers) from one service to reactions in another service. ' +
        'Supported services include GitHub, Discord, Trello, Spotify, Gmail, Reddit, Twitch, and more.',
    )
    .setVersion('1.0')
    .addTag('About', 'Server information and available services overview')
    .addTag('Authentication', 'User authentication and profile management')
    .addTag(
      'Areas',
      'Manage AREA automations (Action-Reaction pairs). An AREA connects an action (trigger) from one service to a reaction in another service.',
    )
    .addTag(
      'Area Parameters',
      'Configure parameters for action and reaction components. Parameters define the specific values needed for each component (e.g., repository name, channel ID).',
    )
    .addTag(
      'Area Executions',
      'Track and manage AREA execution history. Each time an AREA is triggered, an execution record is created with status, duration, and results.',
    )
    .addTag(
      'Services',
      'Available services and service connections. Manage OAuth2 links to external services like GitHub, Discord, Trello, etc.',
    )
    .addTag(
      'Components',
      'Actions and reactions available for each service. Actions are triggers (e.g., "New GitHub Issue"), reactions are responses (e.g., "Send Discord Message").',
    )
    .addTag(
      'Variables',
      'Variables define the input parameters and output values for components.',
    )
    .addTag('Universal Links', 'Universal links for mobile app deep linking')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT token obtained from login/register',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit conversion based on the type specified in the DTO
      },
    }),
  );

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('', { exclude: ['.well-known/*path'] });

  setupSwagger(app);

  const configService = app.get(ConfigService);
  const appConfig = configService.get('app');
  if (!appConfig) {
    throw new Error('App configuration is not properly loaded');
  }
  const port = appConfig.port;

  await app.listen(port);
}
void bootstrap();
