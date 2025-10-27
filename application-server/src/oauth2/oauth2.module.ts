import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OAuth2Service } from './oauth2.service';

@Module({
  imports: [HttpModule],
  providers: [OAuth2Service],
  exports: [OAuth2Service],
})
export class OAuth2Module {}
