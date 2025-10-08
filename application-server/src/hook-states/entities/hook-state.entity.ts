import { DB_COLUMN_LENGTHS } from '../../config';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from '../../areas/entities/area.entity';

@Entity('hook_states')
export class HookState {
  @PrimaryColumn({ type: 'int' })
  area_id: number;

  @PrimaryColumn({ type: 'varchar', length: DB_COLUMN_LENGTHS.hookStateKey })
  state_key: string;

  @Column({ type: 'text', nullable: true })
  state_value: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_checked_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Area, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  area: Area;
}
