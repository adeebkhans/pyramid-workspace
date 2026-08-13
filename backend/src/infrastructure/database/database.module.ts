import { Global, Logger, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';

import { persistenceSettings } from '@pyramid/config';

/**
 * Owns the single Mongoose connection for the process.
 *
 * Strict query filtering is enabled globally so a typo in a filter key raises
 * an error instead of quietly matching every document in the collection — the
 * kind of bug that only shows up once there is real data.
 */
@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [persistenceSettings.KEY],
      useFactory: (settings: ConfigType<typeof persistenceSettings>) => {
        const logger = new Logger('MongooseConnection');
        mongoose.set('strictQuery', true);

        return {
          uri: settings.uri,
          maxPoolSize: settings.maxPoolSize,
          serverSelectionTimeoutMS: 10_000,
          autoIndex: true,
          family: 4,
          connectionFactory: (connection: mongoose.Connection) => {
            connection.on('connected', () => logger.log(`Connected to ${connection.name}`));
            connection.on('disconnected', () => logger.warn('Connection lost'));
            connection.on('error', (error: Error) => logger.error(`Connection error: ${error.message}`));
            return connection;
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
