import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from './modules/redis/redis.module';
import { UserModule } from './modules/users/user.module';
import { CinemaModule } from './modules/cinema/cinema.module';
import { User } from './database/entities/user.entity';
import { Cinema } from './database/entities/cinema.entity';
import { Movie } from './database/entities/movie.entity';
import { AuthModule } from './modules/auth/auth.module';
import { MovieModule } from './modules/movies/movie.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT! || 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [User, Cinema, Movie],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    RedisModule,
    UserModule,
    AuthModule,
    CinemaModule,
    MovieModule,
  ],
})
export class AppModule { }