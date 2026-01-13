import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { getAllowedOrigins } from 'src/config/cors.config';

@ApiTags('Config')
@Controller('config')
export class ConfigController {
    @Get('allowed-origins')
    @ApiOperation({ summary: 'Lấy danh sách origins được phép (public endpoint)' })
    getAllowedOrigins() {
        return {
            origins: getAllowedOrigins(),
        };
    }
}