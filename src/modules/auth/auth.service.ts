import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Profile } from 'passport-google-oauth20';
import { UserService } from '../users/user.service';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UserService) { }

    async loginWithEmail(dto: LoginDto, sessionId: string) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Email không tồn tại!');
        }

        if (user.provider === 'google' || !user.password) {
            throw new BadRequestException(
                'Email này đã liên kết với Google. Vui lòng đăng nhập bằng Google',
            );
        }

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Mật khẩu không chính xác!');
        }

        return {
            message: 'Đăng nhập thành công',
            user: this.serializeUser(user),
            sessionId
        };
    }

    async register(dto: RegisterDto, sessionId: string) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new BadRequestException('Email đã tồn tại');
        }

        const hashed = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            password: hashed,
            provider: 'local',
        });

        return {
            message: 'Đăng ký thành công',
            user: this.serializeUser(user),
            sessionId
        };
    }

    async loginWithGoogle(profile: Profile) {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        const googleId = profile.id;

        if (!email) {
            throw new BadRequestException('Email not provided by Google');
        }

        console.log('🔷 Looking for user with Google ID:', googleId);

        let user = await this.usersService.findByGoogleId(googleId);

        if (!user) {
            console.log('🔷 User not found, creating new user...');
            user = await this.usersService.create({
                email,
                avatar,
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                googleId,
                provider: 'google',
            });
            console.log('🔷 New user created:', user.id);
        } else {
            console.log('🔷 Existing user found:', user.id);
        }

        return {
            message: 'Đăng nhập Google thành công',
            user: this.serializeUser(user),
        };
    }

    serializeUser(user: any) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar,
            provider: user.provider || 'local',
        };
    }
}