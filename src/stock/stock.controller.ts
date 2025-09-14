import { Controller, Get, Param } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('price/:name')
  async getStockPrice(@Param('name') name: string) {
    try {
      const stockPrice = await this.stockService.getStockPrice(
        name,
        new Date(),
      );
      if (stockPrice) {
        return {
          code: 200,
          data: stockPrice,
          message: 'Stock data retrieved successfully',
        };
      }
      return {
        code: 404,
        message: 'No stock data found',
      };
    } catch {
      return {
        code: 500,
        message: 'Error fetching stock data',
      };
    }
  }
}
