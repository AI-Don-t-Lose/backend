import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import type { CategoryStat } from './interfaces/stats.interface';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async classifyStoreCategory(storeName: string): Promise<string> {
    try {
      // DB에서 기존 카테고리들 가져오기
      const existingCategories = await this.prisma.category.findMany({
        select: { categoryName: true },
      });
      const categoryList = existingCategories
        .map((c) => c.categoryName)
        .join(', ');

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const prompt = `"${storeName}"이라는 상점을 적절한 카테고리로 분류해주세요.

      아래는 기존 카테고리가 있다면 이와 동일하거나 가장 유사한 방식으로 분류해주세요:
      ${categoryList}

      아래는 카테고리명에 대한 예시입니다.:
      '식음료, 교통, 쇼핑, 의료, 교육, 엔터테인먼트, 생활서비스, 금융, 통신, 기타'

      카테고리명만 응답해주세요. 다만 실제로 카테고리로 분류할 수 없다면 '기타'로 반환해 주세요`;

      const result = await model.generateContent(prompt);
      const category = result.response.text().trim();

      return category;
    } catch (error) {
      this.logger.error(
        `Failed to classify merchant category for ${storeName}:`,
        error,
      );
      return '기타';
    }
  }

  async processMonthlySpendingStats(
    userId: string,
    targetMonth?: Date,
  ): Promise<void> {
    try {
      // 전월 설정 (targetMonth가 없으면 현재 기준 전월) - UTC 기준
      const now = targetMonth || new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth();

      const lastMonth = new Date(
        Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0),
      );
      const thisMonth = new Date(
        Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0),
      );

      this.logger.log(
        `Processing spending stats for user ${userId}, target month: ${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')} (${lastMonth.toISOString().slice(0, 7)})`,
      );

      // external_id로 사용자 UUID 찾기
      const user = await this.prisma.auth.findFirst({
        where: { externalId: userId },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // 전월 소비내역 가져오기
      const consumptions = await this.prisma.consumption.findMany({
        where: {
          authId: user.id,
          purchaseTime: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
        include: {
          store: {
            include: {
              category: true,
            },
          },
        },
      });

      if (consumptions.length === 0) {
        this.logger.log(
          `No consumption data found for user ${userId} in ${lastMonth.toISOString().slice(0, 7)}`,
        );
        return;
      }

      // 카테고리가 없는 상점들 처리 (중복 제거)
      const uniqueStores = new Map<string, { id: string; storeName: string }>();
      for (const consumption of consumptions) {
        if (
          !consumption.store.categoryId &&
          !uniqueStores.has(consumption.store.id)
        ) {
          uniqueStores.set(consumption.store.id, {
            id: consumption.store.id,
            storeName: consumption.store.storeName,
          });
        }
      }

      for (const [storeId, store] of uniqueStores) {
        await this.assignCategoryToStore(storeId, store.storeName);
      }

      // 카테고리별 소비 집계
      const categoryStats = await this.calculateCategoryStats(
        user.id,
        lastMonth,
        thisMonth,
      );

      // 통계 테이블 업데이트
      await this.updateMonthlyStats(user.id, lastMonth, categoryStats);

      this.logger.log(
        `Successfully processed monthly stats for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process monthly spending stats for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  private async assignCategoryToStore(
    storeId: string,
    storeName: string,
  ): Promise<void> {
    try {
      // Gemini로 카테고리 분류
      const categoryName = await this.classifyStoreCategory(storeName);

      // 카테고리 찾기 또는 생성
      let category = await this.prisma.category.findFirst({
        where: { categoryName },
      });

      if (!category) {
        category = await this.prisma.category.create({
          data: { categoryName },
        });
      }

      // 상점에 카테고리 할당
      await this.prisma.store.update({
        where: { id: storeId },
        data: { categoryId: category.id },
      });

      this.logger.log(
        `Assigned category "${categoryName}" to store "${storeName}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to assign category to store ${storeName}:`,
        error,
      );
    }
  }

  private async calculateCategoryStats(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CategoryStat[]> {
    // 카테고리별 소비 금액 집계
    const consumptions = await this.prisma.consumption.findMany({
      where: {
        authId: userId,
        purchaseTime: {
          gte: startDate,
          lt: endDate,
        },
        store: {
          categoryId: { not: null },
        },
      },
      include: {
        store: {
          include: {
            category: true,
          },
        },
      },
    });

    // 전체 소비 금액
    const totalAmount = await this.prisma.consumption.aggregate({
      where: {
        authId: userId,
        purchaseTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const total = totalAmount._sum.amount || 0;

    // 카테고리별 집계 및 퍼센티지 계산
    const categoryMap = new Map<string, number>();

    for (const consumption of consumptions) {
      if (consumption.store.category) {
        const categoryId = consumption.store.category.id;
        const current = categoryMap.get(categoryId) || 0;
        categoryMap.set(categoryId, current + consumption.amount);
      }
    }

    return Array.from(categoryMap.entries()).map(([categoryId, amount]) => ({
      categoryId,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));
  }

  private async updateMonthlyStats(
    userId: string,
    month: Date,
    categoryStats: CategoryStat[],
  ): Promise<void> {
    // 기존 통계 확인
    const existingStats = await this.prisma.stat.findMany({
      where: {
        authId: userId,
        consumptionYearMonth: month,
      },
    });

    // 기존 통계가 있으면 업데이트하지 않음
    if (existingStats.length > 0) {
      this.logger.log(
        `Existing stats found for user ${userId}, month: ${month.toISOString().slice(0, 7)}. Skipping update.`,
      );
      return;
    }

    // 새로운 통계 생성
    const statsData = categoryStats.map((stat) => ({
      authId: userId,
      categoryId: stat.categoryId,
      consumptionYearMonth: month,
      percentage: stat.percentage,
    }));

    if (statsData.length > 0) {
      await this.prisma.stat.createMany({
        data: statsData,
      });
    }

    this.logger.log(
      `Created ${statsData.length} category stats for user ${userId}, month: ${month.toISOString().slice(0, 7)}`,
    );
  }

  async getMonthlySpendingStats(userId: string): Promise<{
    date: number;
    stats: Array<{ category: string; percentage: number }>;
  }> {
    // external_id로 사용자 UUID 찾기
    const user = await this.prisma.auth.findFirst({
      where: { externalId: userId },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // 전월 날짜 설정 (processMonthlySpendingStats와 동일한 로직) - UTC 기준
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();

    const lastMonth = new Date(
      Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0),
    );

    // 저장된 통계 데이터 먼저 확인
    let statsData = await this.prisma.stat.findMany({
      where: {
        authId: user.id,
        consumptionYearMonth: lastMonth,
      },
      include: {
        category: true,
      },
    });

    // 기존 통계가 없으면 처리 후 다시 가져오기
    if (statsData.length === 0) {
      await this.processMonthlySpendingStats(userId);

      statsData = await this.prisma.stat.findMany({
        where: {
          authId: user.id,
          consumptionYearMonth: lastMonth,
        },
        include: {
          category: true,
        },
      });
    }

    return {
      date: new Date(
        Date.UTC(lastMonth.getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0, 0),
      ).getTime(),
      stats: statsData
        .map((stat) => ({
          category: stat.category.categoryName,
          percentage: stat.percentage,
        }))
        .sort((a, b) => b.percentage - a.percentage),
    };
  }
}
