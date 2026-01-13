import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const client = context.switchToWs().getClient();
        const session = client.handshake?.session;

        if (!session || !session.userId) {
            throw new WsException('Unauthorized: Please login first');
        }

        return true;
    }
}