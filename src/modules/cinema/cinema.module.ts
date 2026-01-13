import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CinemaService } from './cinema.service';
import { CinemaGateway } from './cinema.gateway';
import { CinemaController } from './cinema.controller';
import { Cinema } from 'src/database/entities/cinema.entity';
import { UserModule } from '../users/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([Cinema]), UserModule],
    controllers: [CinemaController],
    providers: [CinemaService, CinemaGateway],
    exports: [CinemaService],
})
export class CinemaModule { }