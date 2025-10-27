import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

enum LinkPlatform {
  WEB = 'web',
  MOBILE = 'mobile',
}

export class LinkServiceDto {
  @ApiPropertyOptional({
    description: 'The OAuth authorization code received from the service',
    example: 'SplxlOBeZQQYbYS6WxSbIA',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  code: string;

  @ApiPropertyOptional({
    description: 'The platform for the link',
    enum: LinkPlatform,
    example: LinkPlatform.WEB,
  })
  @IsEnum(LinkPlatform)
  @IsNotEmpty()
  @IsOptional()
  platform: LinkPlatform;
}
