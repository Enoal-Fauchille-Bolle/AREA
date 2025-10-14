export class OAuthLoginDto {
  service: string;
  code: string;
  redirect_uri: string;
  code_verifier?: string; // Optional for PKCE flow
}
