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

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  icon_path: string | null;

  @Column({ type: 'boolean', default: false })
  requires_auth: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
