import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, IsUrl } from 'class-validator';
import { OAuthProvider } from '../../oauth2';

export class OAuthLoginDto {
  @ApiProperty({
    description:
      'The Authorization code received from the OAuth provider for login',
    example: 'SplxlOBeZQQYbYS6WxSbIA',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'The OAuth provider to use for login',
    enum: OAuthProvider,
    example: OAuthProvider.GOOGLE,
  })
  @IsEnum(OAuthProvider)
  @IsNotEmpty()
  provider: OAuthProvider;

  @ApiProperty({
    description: 'The redirect URI used in the OAuth flow',
    example: 'https://yourapp.com/oauth/callback',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  redirect_uri: string;
}

export class OAuthRegisterDto extends OAuthLoginDto {}
