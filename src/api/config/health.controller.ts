import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Version health indicator — equivalent to VersionHealthCheck.
 * Returns the version from package.json.
 */
@Injectable()
export class VersionHealthIndicator extends HealthIndicator {
  check(key: string): HealthIndicatorResult {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return this.getStatus(key, true, { version: pkg.version });
  }
}

/**
 * Health check controller — exposes /_healthcheck/status.
 * Equivalent to app.UseHealthChecks("/_healthcheck/status", ...).
 */
@Controller('_healthcheck')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly versionIndicator: VersionHealthIndicator,
  ) {}

  @Get('status')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.versionIndicator.check('version'),
    ]);
  }
}
