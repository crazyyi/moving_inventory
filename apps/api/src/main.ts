import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: !isProduction }),
  );

  app.enableCors({
    origin: [
      process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000',
      'http://localhost:3001', // Allow the Swagger UI itself to make requests
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('backend');

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // FIX 3: Use a simpler path and ignore the global prefix for the docs
    SwaggerModule.setup('docs', app, document);

    console.log(`📑 Swagger docs available at: http://localhost:${process.env.API_PORT || 3001}/docs`);
  }

  const port = process.env.API_PORT || 3001;
  await app.listen(port, 'localhost');

  console.log(`🚀 API running on http://localhost:${port}/backend`);
}

bootstrap().catch((err) => {
  console.error('❌ Error during bootstrap:');
  console.error(err);
  process.exit(1);
});