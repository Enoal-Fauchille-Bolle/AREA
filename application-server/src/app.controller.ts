import { Controller, Get, Query, Req, Res, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import type { Request, Response } from 'express';

@Controller()
export class AppController {
  private readonly REDIRECT_URIS: Record<string, string>;
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {
    const appConfig = this.configService.get('app');
    this.REDIRECT_URIS = {
      'web:auth': appConfig.oauth2.auth.web_redirect_uri,
      'mobile:auth': appConfig.oauth2.auth.mobile_redirect_uri,
      'web:service': appConfig.oauth2.service.web_redirect_uri,
      'mobile:service': appConfig.oauth2.service.mobile_redirect_uri,
    };
  }

  @Get('about.json')
  async getAbout(@Req() request: Request): Promise<any> {
    return this.appService.getAbout(request);
  }

  // Specific route to handle Reddit OAuth2 callback
  // (Reddit only allows 1 redirect URI per app)
  @Get('/reddit/callback')
  oauth2RedditCallback(
    @Query('code') code: string,
    // platform:state
    // e.g. mobile:auth
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const redirectUri = this.REDIRECT_URIS[state];
    if (!redirectUri) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Invalid state parameter for Reddit OAuth callback');
    }
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.append('code', code);
    if (state.includes('mobile')) {
      redirectUrl.searchParams.append('state', 'reddit');
    } else if (state === 'web:service') {
      redirectUrl.searchParams.append('state', 'reddit:service_link');
    }

    return res.redirect(redirectUrl.toString());
  }
}
