import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

@Injectable()
export class SessionSerializer extends PassportSerializer {
    serializeUser(user: any, done: (err: Error | null, user: any) => void): void {
        console.log('📝 Serializing user:', user);
        done(null, user);
    }

    deserializeUser(payload: any, done: (err: Error | null, payload: any) => void): void {
        console.log('📖 Deserializing user:', payload);
        done(null, payload);
    }
}