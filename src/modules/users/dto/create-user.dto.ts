import { IsEmail, IsOptional, IsString, IsIn, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    googleId?: string;

    @IsOptional()
    @IsString()
    firstName?: string;


    @IsOptional()
    @IsString()
    lastName?: string;

    // Password chỉ required nếu provider = 'local'
    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsIn(['local', 'google'])
    provider?: 'local' | 'google';
}
