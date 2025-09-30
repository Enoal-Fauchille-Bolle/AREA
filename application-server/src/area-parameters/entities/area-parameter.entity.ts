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
  @PrimaryColumn({ type: 'int' })
  area_id: number;

  @PrimaryColumn({ type: 'int' })
  variable_id: number;

  @Column({ type: 'text' })
  value: string;

  // Relations
  @ManyToOne(() => Variable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variable_id' })
  variable: Variable;

  // Note: Area relationship will be added when Areas module is created
}
