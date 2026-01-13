import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsArray,
    IsEnum,
    Min,
    Max,
    IsUrl,
} from 'class-validator';
import { ViewerPermission } from 'src/database/entities/cinema.entity';

export class CreateRoomDto {
    @IsString()
    name: string;

    @IsUrl()
    movieUrl: string;

    @IsString()
    @IsOptional()
    movieTitle?: string;

    @IsNumber()
    @Min(1)
    @Max(1000)
    @IsOptional()
    capacity?: number;
}

export class JoinRoomDto {
    @IsString()
    cinemaId: string;
}

export class UpdatePlayerStateDto {
    @IsString()
    cinemaId: string;

    @IsNumber()
    @IsOptional()
    currentTime?: number;

    @IsBoolean()
    @IsOptional()
    isPlaying?: boolean;

    @IsNumber()
    @Min(0.25)
    @Max(2.0)
    @IsOptional()
    playbackRate?: number;

    @IsNumber()
    @Min(0)
    @Max(1)
    @IsOptional()
    volume?: number;
}

export class SetPermissionsDto {
    @IsString()
    cinemaId: string;

    @IsString()
    viewerId: string;

    @IsArray()
    @IsEnum(ViewerPermission, { each: true })
    permissions: ViewerPermission[];
}

export class PlayerActionDto {
    @IsString()
    cinemaId: string;

    @IsString()
    @IsEnum(['play', 'pause', 'seek', 'volumeChange', 'rateChange'])
    action: string;

    @IsNumber()
    @IsOptional()
    value?: number;
}