import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { DiscordOAuth2Service } from './oauth2/discord-oauth2.service';
import { GoogleOAuth2Service } from './oauth2/google-oauth2.service';
import { GithubOAuth2Service } from './oauth2/github-oauth2.service';
import { UserService } from './user-services/entities/user-service.entity';
import { UsersModule } from '../users/users.module';
import { ComponentsModule } from '../components/components.module';
import { VariablesModule } from '../variables/variables.module';
import { ServicesService } from './services.service';
import { UserServicesService } from './user-services/user-services.service';
import { ServicesController } from './services.controller';
import { ServicesInitializerService } from './services-initializer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, UserService]),
    UsersModule,
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
  exports: [ServicesService, UserServicesService],
})
export class ServicesModule {}
