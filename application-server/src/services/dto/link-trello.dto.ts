import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkTrelloDto {
  @ApiProperty({
    description: 'Trello OAuth 1.0a token obtained from user authorization',
    example:
      'ATTA2821023dd9afa1b5efb1098c08496693fc88075a9c7b377d74de782eea29e1e3D899318',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
