import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Patch,
    Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';


@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    getAll() {
        return this.userService.findAll();
    }

    @Post('by-ids')
    async getByIds(@Body() body: { ids: number[] }) {
        const users = await this.userService.findByIds(body.ids);
        return { data: users };
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.userService.findById(+id);
    }

    @Post()
    create(@Body() body: CreateUserDto) {
        return this.userService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: UpdateUserDto) {
        return this.userService.update(+id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.userService.delete(+id);
    }
}
