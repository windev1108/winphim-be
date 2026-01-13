import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Địa chỉ email đã đăng ký',
    })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'Mật khẩu tài khoản',
    })
    @IsString()
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    password: string;
}