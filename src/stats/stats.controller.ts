import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from './stats.service';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

interface StatsCategoryResponse {
  category: string;
  percentage: number;
}

interface StatsApiResponse {
  date: string;
  stats: StatsCategoryResponse[];
}

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getStats(@Request() req: RequestWithUser): Promise<StatsApiResponse> {
    if (!req.userId) {
      throw new Error('User ID not found');
    }

    // 전월 소비 통계 처리 및 가져오기
    const statsData = await this.statsService.getMonthlySpendingStats(
      req.userId,
    );

    return {
      date: statsData.date,
      stats: statsData.stats.map((stat) => ({
        category: stat.category,
        percentage: Math.round(stat.percentage * 100) / 100, // 소수점 2자리
      })),
    };
  }
}
