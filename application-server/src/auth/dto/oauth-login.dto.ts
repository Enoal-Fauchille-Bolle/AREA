export class OAuthLoginDto {
  code: string;
  provider: string;
  redirect_uri: string;
}

export class OAuthRegisterDto extends OAuthLoginDto {}
