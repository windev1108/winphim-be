import { IsNumber, IsString } from 'class-validator';

export class AddFavoriteMovieDto {
    @IsString()
    external_id: string;

    @IsString()
    slug: string;

    @IsString()
    name: string;

    @IsString()
    thumb_url: string;

    @IsString()
    poster_url: string;

    @IsString()
    origin_name: string;

    @IsNumber()
    vote_average: number;

    @IsString()
    quality: string;

    @IsString()
    type: string;

    @IsNumber()
    year: number;

    @IsString()
    lang: string;

    @IsString()
    countryName: string;

    @IsString()
    categoryName: string;

}
