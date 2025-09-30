import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hook_states')
export class HookState {
  @PrimaryColumn({ type: 'int' })
  area_id: number;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  state_key: string;

  @Column({ type: 'text', nullable: true })
  state_value: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_checked_at: Date | null;
}
