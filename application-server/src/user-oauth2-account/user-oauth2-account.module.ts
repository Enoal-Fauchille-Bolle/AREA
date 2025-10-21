import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOAuth2AccountsService } from './user-oauth2-account.service';
import { UserOAuth2AccountsController } from './user-oauth2-account.controller';
import { UserOAuth2Account } from './entities/user-oauth2-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserOAuth2Account])],
  controllers: [UserOAuth2AccountsController],
  providers: [UserOAuth2AccountsService],
  exports: [UserOAuth2AccountsService],
})
export class UserOAuth2AccountModule {}
