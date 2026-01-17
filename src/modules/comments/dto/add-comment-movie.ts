import { IsNumber, IsString } from 'class-validator';

export class AddCommentMovieDto {
    @IsString()
    movieThumbnail: string;

    @IsString()
    movieSlug: string;

    @IsString()
    movieName: string;

    @IsString()
    content: string;

    @IsNumber()
    rating: number;
}
