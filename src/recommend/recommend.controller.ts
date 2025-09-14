import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { RecommendService } from './recommend.service';

@Controller('recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getRecommendations(
    @Request() req: RequestWithUser,
  ): Promise<{ date: string; stocks: string[] }> {
    return this.recommendService.getRecommendations(req.userId!);
  }
}
