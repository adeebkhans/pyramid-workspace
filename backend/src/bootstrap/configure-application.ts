import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';

import type { RuntimeSettings, SecuritySettings } from '@pyramid/config';
import { AccessLogInterceptor } from '@pyramid/shared/http/access-log.interceptor';
import { ErrorResponseFilter } from '@pyramid/shared/http/error-response.filter';

/**
 * Applies every cross-cutting concern the HTTP surface needs — prefix, security
 * headers, CORS, validation, logging, error translation.
 *
 * Factored out of `main.ts` so integration tests exercise the *same* pipeline
 * the server runs. A test that bypasses the validation pipe is testing a
 * different application than the one that ships.
 */
export function configureApplication(app: INestApplication): RuntimeSettings {
  const config = app.get(ConfigService);
  const runtime = config.getOrThrow<RuntimeSettings>('runtime');
  const security = config.getOrThrow<SecuritySettings>('security');

  app.setGlobalPrefix(runtime.globalPrefix);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  app.enableCors({
    origin: security.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip unknown keys rather than trusting them…
      whitelist: true,
      // …and reject outright when a client sends something we never declared.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
    }),
  );

  app.useGlobalInterceptors(new AccessLogInterceptor());
  app.useGlobalFilters(new ErrorResponseFilter());

  // Lets the platform drain in-flight requests before the container is killed.
  app.enableShutdownHooks();

  return runtime;
}
