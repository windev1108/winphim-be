import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from 'src/database/entities/movie.entity';
import { Repository } from 'typeorm';
import { AddFavoriteMovieDto } from './dto/add-favorite-movie';

@Injectable()
export class MovieService {
    constructor(
        @InjectRepository(Movie)
        private readonly movieRepo: Repository<Movie>,
    ) { }

    async addFavoriteMovie(userId: number, data: AddFavoriteMovieDto) {
        const movieExist = await this.movieRepo.findOne({ where: { user: { id: userId }, external_id: data.external_id } });
        if (movieExist) {
            throw new BadRequestException('Bạn đã thêm phim này rồi!');
        }
        const LIMIT_FAVORITES = process.env.LIMIT_FAVORITE_MOVIES_PER_USER ? +process.env.LIMIT_FAVORITE_MOVIES_PER_USER! : 20
        const countMovies = await this.movieRepo.count({ where: { id: userId } })
        if (countMovies >= LIMIT_FAVORITES) {
            throw new BadRequestException(`Bạn chỉ được thêm tối đa ${LIMIT_FAVORITES}`);
        }
        const movie = this.movieRepo.create({ user: { id: userId }, country: data.countryName, category: data.categoryName, ...data });
        return await this.movieRepo.save(movie);
    }

    async deleteFavoriteMovie(userId: number, movieId: number) {
        return await this.movieRepo.delete({ user: { id: userId }, id: movieId });
    }

    async getUserMovies(userId: number) {
        return this.movieRepo.find({ where: { user: { id: userId } } });
    }
}
