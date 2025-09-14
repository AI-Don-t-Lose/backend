import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { RecommendService } from './recommend.service';
import type { StockRecommendationDetail } from './types';

@UseGuards(JwtAuthGuard)
@Controller('recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  @Get()
  async getRecommendations(
    @Request() req: RequestWithUser,
  ): Promise<{ date: string; stocks: string[] }> {
    return this.recommendService.getRecommendations(req.userId!);
  }

  @Get(':stockName')
  async getRecommendation(
    @Request() req: RequestWithUser,
    @Param('stockName') stockName: string,
  ): Promise<StockRecommendationDetail> {
    return this.recommendService.getRecommendation(req.userId!, stockName);
  }
}
