import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(config: ConfigService) {
        super({
            clientID: config.get('GOOGLE_CLIENT_ID') ?? '',
            clientSecret: config.get('GOOGLE_CLIENT_SECRET') ?? '',
            callbackURL: config.get('GOOGLE_CALLBACK_URL') ?? '',
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });
    }

    async validate(
        req: any,
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: any,
    ): Promise<any> {
        try {
            console.log('🟡 Google Strategy: Validating...');
            console.log('🟡 Profile ID:', profile.id);
            console.log('🟡 Profile Email:', profile.emails?.[0]?.value);

            // Decode state from query params
            const state = req.query.state;
            let decodedState = null;

            if (state) {
                try {
                    decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
                    console.log('🟡 Decoded state:', decodedState);
                } catch (e) {
                    console.error('❌ Failed to decode state:', e);
                }
            }

            // Pass both profile and state to controller
            done(null, { profile, state: decodedState });
        } catch (error) {
            console.error('❌ Google Strategy Error:', error);
            done(error, null);
        }
    }
}