import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ExternalStockResponseDto } from './dto/external-stock-response.dto';
import { ExternalStockRequestDto } from './dto/external-stock-request.dto';
import { GetStockDto } from './dto/get-stock.dto';
import { ConfigService } from '@nestjs/config';

interface ApiResponse {
  response: ExternalStockResponseDto;
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  private readonly apiKey: string;
  private readonly baseUrl =
    'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = configService.get<string>('STOCK_API_KEY')!;
  }

  async getStockPrice(
    stockName: string,
    date: Date,
  ): Promise<GetStockDto | null> {
    try {
      if (!this.apiKey) {
        this.logger.error('STOCK_API_KEY environment variable is not set');
        throw new Error('STOCK_API_KEY environment variable is not set');
      }

      const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');

      const externalResponse: ExternalStockResponseDto =
        await this.fetchFromExternalAPI({
          serviceKey: this.apiKey,
          resultType: 'json',
          basDt: dateString,
          itmsNm: stockName,
        });

      return this.transformToGetStockDto(externalResponse, date);
    } catch (error) {
      this.logger.error(`Error fetching stock price for ${stockName}:`, error);
      throw error;
    }
  }

  private async fetchFromExternalAPI(
    requestDto: ExternalStockRequestDto,
  ): Promise<ExternalStockResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: requestDto,
        }),
      );

      return (response.data as ApiResponse).response;
    } catch (error) {
      this.logger.error('Error calling external stock API:', error);
      throw new Error('Failed to fetch stock data from external API');
    }
  }

  private transformToGetStockDto(
    externalResponse: ExternalStockResponseDto,
    date: Date,
  ): GetStockDto | null {
    if (
      !externalResponse.body?.items?.item ||
      externalResponse.body.items.item.length === 0
    ) {
      return null;
    }

    const stockItem = externalResponse.body.items.item[0];

    return {
      date: date,
      price: {
        current: parseFloat(stockItem.mkp) || 0,
        fluctuationRate: parseFloat(stockItem.fltRt) || 0,
        vsAmount: parseFloat(stockItem.vs) || 0,
      },
      name: stockItem.itmsNm,
    };
  }
}
