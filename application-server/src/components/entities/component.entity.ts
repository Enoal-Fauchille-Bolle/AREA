import { DB_COLUMN_LENGTHS, DB_DEFAULTS } from 'src/config';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  // CreateDateColumn,
  // UpdateDateColumn,
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
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  service_id: number;

  @Column({ type: 'enum', enum: ComponentType })
  type: ComponentType;

  @Column({ type: 'varchar', length: DB_COLUMN_LENGTHS.componentName })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: DB_DEFAULTS.isActive })
  is_active: boolean;

  @Column({
    type: 'varchar',
    length: DB_COLUMN_LENGTHS.webhookEndpoint,
    nullable: true,
  })
  webhook_endpoint: string | null;

  @Column({ type: 'int', nullable: true })
  polling_interval: number | null;

  // Relations
  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
