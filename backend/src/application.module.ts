import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { configNamespaces, securitySettings, validateEnvironment } from '@pyramid/config';
import { ActivityModule } from '@pyramid/domains/activity/activity.module';
import { CommentsModule } from '@pyramid/domains/discussions/comments.module';
import { MembersModule } from '@pyramid/domains/members/members.module';
import { ProjectsModule } from '@pyramid/domains/projects/projects.module';
import { LabelsModule } from '@pyramid/domains/taxonomy/labels.module';
import { TasksModule } from '@pyramid/domains/tasks/tasks.module';
import { DatabaseModule } from '@pyramid/infrastructure/database/database.module';
import { HealthModule } from '@pyramid/infrastructure/health/health.module';
import { SeedingModule } from '@pyramid/seeding/seeding.module';
import { RequestContextMiddleware } from '@pyramid/shared/http/request-context.middleware';

/**
 * Composition root.
 *
 * Reads bottom-up: cross-cutting infrastructure first (config, database,
 * events, rate limiting), then the business domains, then the demo seeder.
 * No domain module reaches for another domain's controllers — they collaborate
 * through exported services and the event bus.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env.local', '.env'],
      load: configNamespaces,
      validate: validateEnvironment,
    }),

    EventEmitterModule.forRoot({ maxListeners: 20, verboseMemoryLeak: true }),

    ThrottlerModule.forRootAsync({
      inject: [securitySettings.KEY],
      useFactory: (security: ConfigType<typeof securitySettings>) => [
        {
          ttl: security.rateLimit.ttlSeconds * 1_000,
          limit: security.rateLimit.maxRequests,
        },
      ],
    }),

    DatabaseModule,
    HealthModule,

    MembersModule,
    LabelsModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    ActivityModule,

    SeedingModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
