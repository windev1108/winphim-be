import { IsNumber, IsString } from 'class-validator';

export class AddCommentMovieDto {
    @IsString()
    movieId: string;

    @IsString()
    content: string;

    @IsNumber()
    rating: number;
}
