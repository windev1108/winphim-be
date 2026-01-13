import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionSerializer } from './session.serializer';
import { UserModule } from '../users/user.module';
import { GoogleStrategy } from './google.strategy';

@Module({
    imports: [
        UserModule,
        PassportModule.register({ session: true }),
    ],
    controllers: [AuthController],
    providers: [AuthService, GoogleStrategy, SessionSerializer],
    exports: [AuthService],
})
export class AuthModule { }