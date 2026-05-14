import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Service health check' })
  async check() {
    const dbStatus = await this.dataSource
      .query('SELECT 1')
      .then(() => 'ok')
      .catch(() => 'error');

    return {
      status:    'ok',
      db:        dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
