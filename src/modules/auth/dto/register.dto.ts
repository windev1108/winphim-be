import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        example: 'Nguyễn Văn A',
        description: 'Họ tên đầy đủ của người dùng',
        minLength: 2,
        maxLength: 100,
    })
    @IsString()
    @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
    @MaxLength(100, { message: 'Tên không được vượt quá 100 ký tự' })
    firstName: string;

    @IsString()
    @MinLength(2, { message: 'Họ phải có ít nhất 2 ký tự' })
    @MaxLength(100, { message: 'Họ không được vượt quá 100 ký tự' })
    lastName: string;

    @ApiProperty({
        example: 'user@example.com',
        description: 'Địa chỉ email hợp lệ',
    })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'Mật khẩu (tối thiểu 6 ký tự)',
        minLength: 6,
        maxLength: 50,
    })
    @IsString()
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
    password: string;
}