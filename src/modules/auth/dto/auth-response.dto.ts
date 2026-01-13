import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'A' })
    firstName: string;

    @ApiProperty({ example: 'Nguyen' })
    lastName: string;

    @ApiProperty({ example: 'user@example.com' })
    email: string;

    @ApiProperty({ example: 'https://avatar.com/user.jpg', required: false })
    avatar?: string;

    @ApiProperty({ example: 'local', enum: ['local', 'google'] })
    provider: string;
}

export class AuthResponseDto {
    @ApiProperty({ example: 'Login successful' })
    message: string;

    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    token: string;
}

export class LogoutResponseDto {
    @ApiProperty({ example: 'Logout successful' })
    message: string;

    @ApiProperty({ example: true })
    success: boolean;
}