import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class LinkServiceDto {
  @ApiProperty({
    description:
      'The Authorization code received from the OAuth provider for the link',
    example: 'SplxlOBeZQQYbYS6WxSbIA',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'The platform for the link',
    enum: ['web', 'mobile'],
    example: 'web',
  })
  @IsEnum(['web', 'mobile'])
  @IsNotEmpty()
  platform: 'web' | 'mobile';
}
