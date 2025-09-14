import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}
