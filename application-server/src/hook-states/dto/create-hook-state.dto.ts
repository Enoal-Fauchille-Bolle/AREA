import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHookStateDto {
  @ApiProperty({
    description: 'ID of the area this hook state belongs to',
    example: 1,
  })
  @IsInt()
  area_id: number;

  @ApiProperty({
    description: 'Key identifier for this state entry',
    example: 'last_message_id',
  })
  @IsString()
  state_key: string;

  @ApiProperty({
    description: 'Value of the state (stored as string)',
    example: '123456789',
  })
  @IsString()
  state_value: string;

  @ApiPropertyOptional({
    description: 'Timestamp of when this state was last checked',
    example: '2024-01-01T12:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  last_checked_at?: Date;
}
