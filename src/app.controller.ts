import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import type { RequestWithUser } from './auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthGuard)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/user')
  getUserId(@Request() req: RequestWithUser): { userId: string } {
    return { userId: req.userId! };
  }
}
