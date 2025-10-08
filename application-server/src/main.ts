import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { AppConfig } from './config';

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AREA API Documentation')
    .setDescription('API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  setupSwagger(app);

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');
  const port = appConfig.port;

  await app.listen(port);
}
void bootstrap();
