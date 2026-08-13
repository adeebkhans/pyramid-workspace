import 'reflect-metadata';
import { setDefaultResultOrder, setServers } from 'node:dns';
setServers(['8.8.8.8', '8.8.4.4']);
setDefaultResultOrder('ipv4first');

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { ApplicationModule } from '@pyramid/application.module';
import { configureApplication } from '@pyramid/bootstrap/configure-application';
import { mountOpenApi } from '@pyramid/bootstrap/openapi';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(ApplicationModule, { bufferLogs: true });
  const runtime = configureApplication(app);

  if (runtime.swaggerEnabled) {
    const docsRoute = mountOpenApi(app, runtime.globalPrefix);
    logger.log(`API reference available at /${docsRoute}`);
  }

  await app.listen(runtime.port, '0.0.0.0');
  logger.log(`Pyramid API listening on port ${runtime.port} (${runtime.environment})`);
}

void bootstrap();
