import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  RecommendationResponse,
  AIBriefingResponse,
  StockRecommendationDetail,
} from './types';

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

응답 형식 (다른 설명 없이 이 형식만):
삼성전자:85, LG화학:78, 네이버:82

위 예시처럼 "회사명:점수" 형태로 3개만 쉼표로 구분해서 응답하세요.`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim();

      this.logger.log(`Gemini raw response: "${text}"`);

      const stocksWithScores = text
        .split(',')
        .map((item) => {
          const trimmed = item.trim();
          const colonIndex = trimmed.lastIndexOf(':');

          if (colonIndex === -1) {
            // 콜론이 없으면 기본값
            return {
              stockName: trimmed.slice(0, 10) || '삼성전자', // 최대 10글자
              score: 50,
            };
          }

          const stockName = trimmed.slice(0, colonIndex).trim();
          const scoreStr = trimmed.slice(colonIndex + 1).trim();
          const score = parseInt(scoreStr, 10);

          return {
            stockName: stockName || '삼성전자',
            score: isNaN(score) || score < 0 || score > 100 ? 50 : score,
          };
        })
        .filter(
          (item) => item.stockName.length > 0 && item.stockName.length <= 20,
        )
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

  async getRecommendation(
    userId: string,
    stockName: string,
  ): Promise<StockRecommendationDetail> {
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

    const existingRecommendation = await this.prisma.recommendation.findFirst({
      where: {
        userId: user.id,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        stockName,
      },
      orderBy: { score: 'desc' },
    });

    if (!existingRecommendation) {
      throw new Error(`Recommendation not found for stock: ${stockName}`);
    }

    // 사용자의 소비 통계 가져오기
    const consumptionStats = await this.getConsumptionStats(user.id);

    // 전날 기준으로 브리핑 생성
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStart = new Date(
      Date.UTC(
        yesterday.getUTCFullYear(),
        yesterday.getUTCMonth(),
        yesterday.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const statsDescription = consumptionStats
      .map((stat) => `${stat.category}: ${stat.percentage}%`)
      .join(', ');

    const prompt = `"${stockName}" 주식에 대해 상세한 분석과 브리핑을 제공해주세요.

사용자의 소비 패턴: ${statsDescription}

절대적인 규칙 - 이 규칙을 위반하면 응답이 거부됩니다:
- 실제 존재하는 뉴스 링크만 사용하세요 (네이버뉴스, 한국경제, 매일경제 등)
- 괄호 문구 절대 금지: "(실제", "(기입", "(요약)", "(분석)" 등 모든 괄호 문구 사용 금지
- "실제 데이터로 기입", "실제 내용 요약" 같은 지시 문구 절대 금지
- 반드시 아래의 JSON 형태로만 응답해주세요
- 다른 설명, 주석, 마크다운 코드 블록은 절대 사용하지 마세요
- JSON 객체 앞뒤로 어떤 텍스트도 추가하지 마세요
- 예시 내용이나 교체 문구는 절대 사용 금지
- 예시나 템플릿 형태의 문구 사용 시 응답 무효
- 모든 텍스트는 완성된 최종 내용으로만 작성

아래와 같은 형식으로 JSON 형태로 응답해주세요:
{
  "reason": "사용자의 소비 패턴과 연관하여 왜 이 주식을 추천하는지 구체적으로 설명 (100-200자)",
  "contents": "전날 기준 주식 브리핑 및 시장 분석, 주가 동향, 실적 전망 등을 실제 데이터로 작성 (300-500자)",
  "news": [
    {
      "link": "https://finance.naver.com/news/news_read.naver?article_id=0004123456&office_id=009",
      "summary": "뉴스 핵심 내용 요약 (50-100자)",
      "date": "2024-09-13"
    },
    {
      "link": "https://finance.naver.com/news/news_read.naver?article_id=0004987654&office_id=001",
      "summary": "뉴스 핵심 내용 요약 (50-100자)",
      "date": "2024-09-12"
    }
  ]
}

`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim();

      // JSON 파싱 시도 (코드 블록 마커 및 추가 텍스트 제거)
      let aiResponse: AIBriefingResponse;
      try {
        this.logger.log(`Gemini briefing raw response: "${text}"`);

        // ```json과 ``` 마커, 그리고 JSON 이후의 모든 텍스트 제거
        let cleanedText = text
          .replace(/^```json\s*/, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '')
          .trim();

        // JSON 객체가 끝나는 지점 찾기 (}가 마지막으로 나오는 위치)
        const lastBraceIndex = cleanedText.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          cleanedText = cleanedText.substring(0, lastBraceIndex + 1);
        }

        const parsed = JSON.parse(cleanedText) as AIBriefingResponse;
        aiResponse = parsed;
      } catch (parseError) {
        this.logger.error(
          'Failed to parse Gemini AI JSON response',
          parseError,
        );
        // 기본값 설정
        aiResponse = {
          reason: `${stockName}는 사용자의 소비 패턴과 연관성이 높은 업종으로 투자 가치가 있습니다.`,
          contents: `${stockName}에 대한 브리핑 정보를 제공할 수 없습니다.`,
          news: [
            {
              link: 'https://finance.naver.com',
              summary: '관련 뉴스를 현재 찾을 수 없습니다.',
              date: yesterdayStart.toISOString().split('T')[0],
            },
          ],
        };
      }

      return {
        score: Math.round(existingRecommendation.score || 0),
        reason:
          aiResponse.reason || `${stockName} 추천 이유를 제공할 수 없습니다.`,
        summary: {
          date: yesterdayStart.toISOString(),
          contents:
            aiResponse.contents ||
            `${stockName}에 대한 브리핑 정보를 제공할 수 없습니다.`,
        },
        news: (aiResponse.news || []).map((newsItem) => ({
          link: newsItem.link || 'https://finance.naver.com',
          summary: newsItem.summary || '뉴스 요약을 제공할 수 없습니다.',
          date: new Date(`${newsItem.date}T00:00:00.000Z`).toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate stock briefing with Gemini AI',
        error,
      );

      this.logger.log(
        `Using fallback for ${stockName}, existing score: ${existingRecommendation.score}`,
      );

      return {
        score: Math.round(existingRecommendation.score || 0),
        reason: `${stockName}는 사용자의 소비 패턴과 연관성이 높은 업종으로 투자 가치가 있습니다.`,
        summary: {
          date: yesterdayStart.toISOString(),
          contents: `${stockName}에 대한 상세한 브리핑 정보를 현재 제공할 수 없습니다.`,
        },
        news: [
          {
            link: 'https://finance.naver.com',
            summary: '관련 뉴스를 현재 제공할 수 없습니다.',
            date: yesterdayStart.toISOString(),
          },
        ],
      };
    }
  }
}
