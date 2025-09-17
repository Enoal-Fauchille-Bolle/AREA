import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AboutService } from './about.service';

@Controller()
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get('/about.json')
  async getAbout(@Req() req: Request) {
    const clientHost = req.ip || req.connection.remoteAddress || '';
    const data = await this.aboutService.getAboutData(clientHost);
    return data;
  }
}
