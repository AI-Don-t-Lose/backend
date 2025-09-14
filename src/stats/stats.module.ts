import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
