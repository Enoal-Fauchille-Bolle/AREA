import { Controller } from '@nestjs/common';
import { UserOAuth2AccountsService as UserOAuth2AccountsService } from './user-oauth2-account.service';

@Controller('user-oauth2-accounts')
export class UserOAuth2AccountsController {
  constructor(
    private readonly userOAuth2AccountService: UserOAuth2AccountsService,
  ) {}
}
