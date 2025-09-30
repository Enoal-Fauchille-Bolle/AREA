import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';

export enum ComponentType {
  ACTION = 'action',
  REACTION = 'reaction',
}

@Entity('components')
export class Component {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  service_id: number;

  @Column({
    type: 'enum',
    enum: ComponentType,
  })
  type: ComponentType;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true })
  webhook_endpoint: string | null;

  @Column({ type: 'int', nullable: true })
  polling_interval: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;
}