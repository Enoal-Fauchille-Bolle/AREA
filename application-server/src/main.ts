import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

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

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
