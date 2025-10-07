import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import type { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('about.json')
  async getAbout(@Req() request: Request): Promise<any> {
    return this.appService.getAbout(request);
  }
}
