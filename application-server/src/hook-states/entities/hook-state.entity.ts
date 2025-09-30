import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hook_states')
export class HookState {
  @PrimaryColumn()
  area_id: number;

  @PrimaryColumn({ type: 'varchar' })
  state_key: string;

  @Column({ type: 'text' })
  state_value: string;

  @Column({ type: 'timestamp', nullable: true })
  last_checked_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}