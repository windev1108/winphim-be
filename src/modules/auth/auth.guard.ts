import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const session = (request as any).session;
        if (!session || !session.user?.id) {
            throw new UnauthorizedException('Please login to access this resource');
        }

        // Attach user to request
        (request as any).user = session.user;

        return true;
    }
}