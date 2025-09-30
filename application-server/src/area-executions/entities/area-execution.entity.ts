import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
}

@Entity('area_executions')
export class AreaExecution {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  area_id: number;

  @Column({ type: 'varchar', length: 20, default: ExecutionStatus.PENDING })
  status: ExecutionStatus;

  @Column({ type: 'jsonb', nullable: true })
  trigger_data: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  execution_result: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'timestamp' })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'bigint', nullable: true })
  execution_time_ms: number | null;
}
