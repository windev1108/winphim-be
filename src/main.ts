import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { Server } from 'socket.io';
import { getAllowedOrigins } from './config/cors.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // redis client
  const redisClient = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });

  redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
  redisClient.on('connect', () => console.log('✅ Redis Client Connected'));
  await redisClient.connect();


  const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  });

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  // socket.io
  const httpServer = app.getHttpServer();

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(','),
      credentials: true,
    },
  });

  io.use((socket: any, next: (err?: any) => void) => {
    sessionMiddleware(socket.request, {} as any, next);
  });


  (app as any).set('io', io);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(','),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('WinPhim API')
    .setVersion('1.0')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const PORT = process.env.PORT || 5000
  await app.listen(PORT);
  console.log(`🚀 Cinema Service running on: http://localhost:${PORT} 
    🔌 WebSocket available on: ws://localhost:${PORT} 
    📊 Redis: ${process.env.REDIS_HOST}: ${process.env.REDIS_PORT} 
    🗄️ Database: ${process.env.DB_NAME} 
    🚀 Swagger: http://localhost:${PORT}/api/docs`)
}

bootstrap();
