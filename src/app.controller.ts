import { Controller, Get, Request } from '@nestjs/common';
import { AppService } from 'src/app.service';
import type { RequestWithUser } from './auth/interfaces/request-with-user.interface';

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
