import { IsNumber, IsString } from 'class-validator';

export class EditCommentMovieDto {
    @IsString()
    movieId: string;

    @IsString()
    content: string;

    @IsNumber()
    rating: number;
}
