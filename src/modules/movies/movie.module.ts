import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { Movie } from 'src/database/entities/movie.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Movie])],
    providers: [MovieService],
    controllers: [MovieController],
    exports: [MovieService],
})
export class MovieModule { }
