import { Module, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { envConfig } from 'src/config/env.config';
import { StockModule } from './stock/stock.module';
import { AuthModule } from './auth/auth.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot(envConfig),
    StockModule,
    AuthModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationShutdown {
  private readonly logger = new Logger(AppModule.name);

  onApplicationShutdown(signal: string) {
    console.log('');
    this.logger.error(`Application is shutting down with signal: ${signal}`);
  }
}
