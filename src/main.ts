import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { Server } from 'socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // redis client
  const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    },
  });

  redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
  redisClient.on('connect', () => console.log('✅ Redis Client Connected'));
  redisClient.on('ready', () => console.log('✅ Redis Ready'));
  redisClient.on('reconnecting', () => console.log('🔄 Redis Reconnecting'));
  await redisClient.connect();

  try {
    await redisClient.ping();
    console.log('✅ Redis Ping Successful');
  } catch (error) {
    console.error('❌ Redis Ping Failed:', error);
    throw error;
  }
  const isProduction = process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' || // Render sets this
    !!process.env.RENDER_SERVICE_NAME; // Alternative check


  const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day
    },
    name: 'connect.sid',
  });

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  app.use((req: any, _res: any, next: any) => {
    console.log('🔍 Session Debug:', {
      sessionID: req.sessionID,
      session: req.session,
      cookies: req.cookies,
      headers: req.headers.cookie,
    });
    next();
  });
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
    origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
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
    📊 Redis: ${process.env.REDIS_URL} 
    🗄️ Database: ${process.env.REDIS_URL} 
    🚀 Swagger: http://localhost:${PORT}/api/docs`)
}

bootstrap();
