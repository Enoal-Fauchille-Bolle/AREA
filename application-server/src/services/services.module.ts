import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { DiscordOAuth2Service } from './oauth2/discord-oauth2.service';
import { GoogleOAuth2Service } from './oauth2/google-oauth2.service';
import { GithubOAuth2Service } from './oauth2/github-oauth2.service';
import { ComponentsModule } from '../components/components.module';
import { VariablesModule } from '../variables/variables.module';
import { ServicesService } from './services.service';
import { UserServicesService } from './user-services/user-services.service';
import { ServicesController } from './services.controller';
import { ServicesInitializerService } from './services-initializer.service';

@Module({
  imports: [
    ComponentsModule,
    VariablesModule,
  ],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    ServicesInitializerService,
    DiscordOAuth2Service,
    GoogleOAuth2Service,
    GithubOAuth2Service,
  ],
  exports: [ServicesService, DiscordOAuth2Service, GoogleOAuth2Service],
})
export class ServicesModule {}
