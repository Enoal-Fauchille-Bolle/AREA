import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('area_executions')
export class AreaExecution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'area_id' })
  areaId: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @Column({
    name: 'trigger_data',
    type: 'jsonb',
  })
  triggerData: Record<string, any>;

  @Column({
    name: 'execution_result',
    type: 'jsonb',
    nullable: true,
  })
  executionResult: Record<string, any> | null;

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
  })
  errorMessage: string | null;

  @Column({
    name: 'started_at',
    type: 'timestamp',
    nullable: true,
  })
  startedAt: Date | null;

  @Column({
    name: 'completed_at',
    type: 'timestamp',
    nullable: true,
  })
  completedAt: Date | null;

  @Column({
    name: 'execution_time_ms',
    type: 'bigint',
    nullable: true,
  })
  executionTimeMs: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}