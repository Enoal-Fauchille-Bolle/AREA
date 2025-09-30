import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Variable } from '../../variables/entities/variable.entity';

@Entity('area_parameters')
export class AreaParameter {
  @PrimaryColumn()
  area_id: number;

  @PrimaryColumn()
  variable_id: number;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'boolean', default: false })
  is_template: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Variable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variable_id' })
  variable: Variable;

  // Note: Area relationship will be added when Areas module is created
}