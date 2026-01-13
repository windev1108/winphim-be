import { Controller, Post, Get, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { MovieService } from './movie.service';
import { AddFavoriteMovieDto } from './dto/add-favorite-movie';
import { AuthGuard } from '../auth/auth.guard';

@Controller('movies')
@UseGuards(AuthGuard)
export class MovieController {
    constructor(private readonly movieService: MovieService) { }

    @Post('favorite')
    async addFavoriteMovie(@Request() req, @Body() body: AddFavoriteMovieDto) {
        const userId = req.user.id.toString();
        const movie = await this.movieService.addFavoriteMovie(userId, body);
        return { data: movie };
    }

    @Delete('favorite')
    async deleteFavoriteMovie(@Request() req, @Body() body: { movieId: number }) {
        const userId = req.user.id.toString();
        const movie = await this.movieService.deleteFavoriteMovie(userId, body.movieId);
        return { data: movie };
    }

    @Get('/mine')
    async getUserMovies(@Request() req) {
        const userId = req.user.id.toString();
        const movies = await this.movieService.getUserMovies(userId);
        return { data: movies };
    }
}
