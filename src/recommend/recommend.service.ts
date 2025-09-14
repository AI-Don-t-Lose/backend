import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface RecommendationResponse {
  date: string;
  stocks: string[];
}

@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async getRecommendations(userId: string): Promise<RecommendationResponse> {
    // external_id로 사용자 UUID 찾기
    const user = await this.prisma.auth.findFirst({
      where: { externalId: userId },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const currentMonth = new Date();
    const monthStart = new Date(
      Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(
        currentMonth.getUTCFullYear(),
        currentMonth.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );

    const existingRecommendations = await this.prisma.recommendation.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      orderBy: { score: 'desc' },
      take: 3,
    });

    if (existingRecommendations.length >= 3) {
      // 기존 추천이 3개 이상 있으면 그대로 반환 (sequence 순서로)
      return {
        date: existingRecommendations[0].createdAt.toISOString(),
        stocks: existingRecommendations.slice(0, 3).map((rec) => rec.stockName),
      };
    }

    // 추천이 없으면 새로 생성
    const consumptionStats = await this.getConsumptionStats(user.id);
    const recommendations =
      await this.generateRecommendations(consumptionStats);

    if (recommendations.length === 0) {
      return {
        date: new Date().toISOString(),
        stocks: [],
      };
    }

    const createdRecommendations = await Promise.all(
      recommendations.map((rec) =>
        this.prisma.recommendation.create({
          data: {
            userId: user.id,
            stockName: rec.stockName,
            score: rec.score,
            recommendedAt: new Date(),
          },
        }),
      ),
    );

    return {
      date: createdRecommendations[0].createdAt.toISOString(),
      stocks: createdRecommendations
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((rec) => rec.stockName),
    };
  }

  private async getConsumptionStats(userUuid: string) {
    const lastMonth = new Date();
    lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);
    const monthStart = new Date(
      Date.UTC(lastMonth.getUTCFullYear(), lastMonth.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(
        lastMonth.getUTCFullYear(),
        lastMonth.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );

    const stats = await this.prisma.stat.findMany({
      where: {
        authId: userUuid,
        consumptionYearMonth: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        category: true,
      },
    });

    if (stats.length === 0) {
      return [];
    }

    const totalPercentage = stats.reduce(
      (sum, stat) => sum + stat.percentage,
      0,
    );

    return stats.map((stat) => ({
      category: stat.category.categoryName,
      percentage: Math.round((stat.percentage / totalPercentage) * 10000) / 100,
    }));
  }

  private async generateRecommendations(
    stats: { category: string; percentage: number }[],
  ): Promise<{ stockName: string; score: number }[]> {
    if (stats.length === 0) {
      return [];
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const statsDescription = stats
      .map((stat) => `${stat.category}: ${stat.percentage}%`)
      .join(', ');

    const prompt = `사용자의 지난달 소비 패턴을 분석하여 한국 주식 3개를 추천하고 각각의 추천 점수(0-100)를 매겨주세요.

소비 패턴: ${statsDescription}

다음 조건에 맞춰 추천해주세요:
1. 소비 패턴과 연관성이 높은 업종의 주식
2. 한국거래소에 상장된 실제 주식명
3. 정확한 회사명으로 응답 (예: 삼성전자, LG화학, 네이버)
4. 소비 패턴과의 연관성에 따라 0-100점 점수 부여

응답 형식: "주식명1:점수1, 주식명2:점수2, 주식명3:점수3" (예: "삼성전자:85, LG화학:78, 네이버:82")`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim();

      const stocksWithScores = text
        .split(',')
        .map((item) => {
          const [stockName, scoreStr] = item.trim().split(':');
          const score = parseInt(scoreStr?.trim() || '0', 10);
          return {
            stockName: stockName?.trim() || '',
            score: isNaN(score) ? 50 : score,
          };
        })
        .filter((item) => item.stockName.length > 0)
        .slice(0, 3);

      if (stocksWithScores.length === 3) {
        return stocksWithScores;
      }
    } catch (error) {
      this.logger.error(
        'Failed to generate recommendations with Gemini AI',
        error,
      );
    }

    return [];
  }
}
