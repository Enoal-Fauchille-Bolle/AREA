import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOAuth2Account } from './entities/user-oauth2-account.entity';

@Injectable()
export class UserOAuth2AccountsService {
  constructor(
    @InjectRepository(UserOAuth2Account)
    private readonly userOAuth2AccountRepository: Repository<UserOAuth2Account>,
  ) {}
}
