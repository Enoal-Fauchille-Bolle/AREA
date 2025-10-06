import { DB_COLUMN_LENGTHS, DB_DEFAULTS } from 'src/config';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  // CreateDateColumn,
  // UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({
    type: 'varchar',
    length: DB_COLUMN_LENGTHS.serviceName,
    unique: true,
  })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  icon_path: string | null;

  @Column({ type: 'boolean', default: DB_DEFAULTS.requiresAuth })
  requires_auth: boolean;

  @Column({ type: 'boolean', default: DB_DEFAULTS.isActive })
  is_active: boolean;
}
