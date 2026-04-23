import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.use(cookieParser());
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/webhooks/stripe' && req.method === 'POST') {
      return bodyParser.raw({ type: 'application/json' })(req, res, next);
    }
    return bodyParser.json({ limit: '2mb' })(req, res, next);
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({ origin, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] });
  app.useWebSocketAdapter(new IoAdapter(app));
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
