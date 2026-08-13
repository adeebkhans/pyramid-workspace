import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, MongooseHealthIndicator } from '@nestjs/terminus';

import { SkipThrottle } from '@nestjs/throttler';

/**
 * Two probes, because they answer different questions:
 *  • `/health/live`  — is the process up? Used by the container runtime to
 *    decide whether to restart. Never touches the database.
 *  • `/health/ready` — can it actually serve traffic? Used by the load
 *    balancer, and it does check Mongo.
 *
 * Conflating the two is how a brief database blip turns into a restart loop.
 */
@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongo: MongooseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — process is running' })
  live() {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — database reachable and heap within budget' })
  ready() {
    return this.health.check([
      () => this.mongo.pingCheck('mongodb', { timeout: 3_000 }),
      () => this.memory.checkHeap('heap', 512 * 1024 * 1024),
    ]);
  }
}
