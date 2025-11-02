import { NestFactory } from '@nestjs/core';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AREA API Documentation')
    .setDescription('API documentation for the AREA application server')
    .setVersion('1.0')
    .addTag('Universal Links')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
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
