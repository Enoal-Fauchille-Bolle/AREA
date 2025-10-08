import { DB_COLUMN_LENGTHS, DB_DEFAULTS } from '../../config';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Component } from '../../components/entities/component.entity';
import { AreaParameter } from '../../area-parameters/entities/area-parameter.entity';
import { AreaExecution } from '../../area-executions/entities/area-execution.entity';
import { HookState } from '../../hook-states/entities/hook-state.entity';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  component_action_id: number;

  @Column()
  component_reaction_id: number;

  @Column({ type: 'varchar', length: DB_COLUMN_LENGTHS.areaName })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: DB_DEFAULTS.isActive })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_triggered_at: Date | null;

  @Column({ type: 'int', default: DB_DEFAULTS.triggeredCount })
  triggered_count: number;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Component, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_action_id' })
  componentAction: Component;

  @ManyToOne(() => Component, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_reaction_id' })
  componentReaction: Component;

  @OneToMany(() => AreaParameter, (parameter) => parameter.area)
  parameters: AreaParameter[];

  @OneToMany(() => AreaExecution, (execution) => execution.area)
  executions: AreaExecution[];

  @OneToMany(() => HookState, (hookState) => hookState.area)
  hookStates: HookState[];
}
