import { ApiProperty } from '@nestjs/swagger';
import { Area } from '../entities/area.entity';

export class AreaResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the AREA',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'ID of the user who owns this AREA',
    example: 42,
    type: 'integer',
  })
  user_id: number;

  @ApiProperty({
    description: 'ID of the action component (trigger)',
    example: 5,
    type: 'integer',
  })
  component_action_id: number;

  @ApiProperty({
    description: 'ID of the reaction component (response)',
    example: 12,
    type: 'integer',
  })
  component_reaction_id: number;

  @ApiProperty({
    description: 'Name of the AREA',
    example: 'GitHub to Discord Notification',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the AREA',
    example: 'Send Discord message when new GitHub issue is created',
  })
  description: string;

  @ApiProperty({
    description: 'Whether the AREA is currently active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Timestamp when the AREA was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the AREA was last updated',
    example: '2024-01-20T15:45:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Timestamp when the AREA was last triggered',
    example: '2024-01-25T08:20:00.000Z',
    nullable: true,
  })
  last_triggered_at: Date | null;

  @ApiProperty({
    description: 'Number of times the AREA has been triggered',
    example: 15,
    type: 'integer',
  })
  triggered_count: number;

  constructor(area: Area) {
    this.id = area.id;
    this.user_id = area.user_id;
    this.component_action_id = area.component_action_id;
    this.component_reaction_id = area.component_reaction_id;
    this.name = area.name;
    this.description = area.description;
    this.is_active = area.is_active;
    this.created_at = area.created_at;
    this.updated_at = area.updated_at;
    this.last_triggered_at = area.last_triggered_at;
    this.triggered_count = area.triggered_count;
  }
}
