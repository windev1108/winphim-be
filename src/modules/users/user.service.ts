import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';


@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    findAll() {
        return this.userRepo.find();
    }

    findById(id: number) {
        return this.userRepo.findOne({ where: { id } });
    }

    findByGoogleId(id: string) {
        return this.userRepo.findOne({ where: { googleId: id } });
    }

    findByEmail(email: string) {
        return this.userRepo.findOne({ where: { email }, select: ['id', 'email', 'avatar', 'googleId', 'firstName', 'lastName', 'password', 'provider'] });
    }

    async findByIds(ids: number[]) {
        if (!ids || ids.length === 0) return [];
        return this.userRepo.findByIds(ids);
    }

    async create(data: CreateUserDto) {
        const user = this.userRepo.create(data);
        return this.userRepo.save(user);
    }

    async update(id: number, data: UpdateUserDto) {
        await this.userRepo.update(id, data);
        return this.findById(id);
    }

    delete(id: number) {
        return this.userRepo.delete(id);
    }
}
