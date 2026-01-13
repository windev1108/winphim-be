import { Module, Global } from '@nestjs/common';
import { createClient } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: async () => {
                const client = createClient({
                    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
                });


                client.on('error', (err) => console.error('Redis Client Error', err));
                client.on('connect', () => console.log('Redis Module Client Connected'));

                await client.connect();
                return client;
            },
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule { }