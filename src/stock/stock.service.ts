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

      // 최대 10일 전까지 데이터를 찾을 때까지 시도
      let attempts = 0;
      let requestDate = this.getLastTradingDate(date);

      while (attempts < 10) {
        const dateString = requestDate
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, '');

        const externalResponse: ExternalStockResponseDto =
          await this.fetchFromExternalAPI({
            serviceKey: this.apiKey,
            resultType: 'json',
            basDt: dateString,
            itmsNm: stockName,
          });

        const result = this.transformToGetStockDto(
          externalResponse,
          requestDate,
        );
        if (result) {
          return result;
        }

        // 데이터가 없으면 하루 전으로 이동
        requestDate.setDate(requestDate.getDate() - 1);
        requestDate = this.getLastTradingDate(requestDate);
        attempts++;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error fetching stock price for ${stockName}:`, error);
      throw error;
    }
  }

  private getLastTradingDate(date: Date): Date {
    const targetDate = new Date(date);

    // 주말과 공휴일을 고려하여 최근 거래일 찾기
    // 최대 10일 전까지 확인 (공휴일 연휴 고려)
    let attempts = 0;
    while (attempts < 10) {
      const dayOfWeek = targetDate.getDay();

      // 주말이 아닌 평일이면 반환
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        return targetDate;
      }

      // 하루 전으로 이동
      targetDate.setDate(targetDate.getDate() - 1);
      attempts++;
    }

    // 10일 내에 거래일을 찾지 못하면 원본 날짜 반환
    return new Date(date);
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
