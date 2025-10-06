import { DB_COLUMN_LENGTHS, DB_DEFAULTS } from 'src/config';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({
    type: 'varchar',
    length: DB_COLUMN_LENGTHS.email,
    unique: true,
  })
  email: string;

  @Column({ type: 'varchar', length: DB_COLUMN_LENGTHS.username, unique: true })
  username: string;

  @Column({ type: 'varchar', length: DB_COLUMN_LENGTHS.passwordHash, nullable: true })
  password_hash: string | null;

  @Column({ type: 'text', nullable: true })
  icon_path: string | null;

  @Column({ type: 'boolean', default: DB_DEFAULTS.isAdmin })
  is_admin: boolean;

  @Column({ type: 'boolean', default: DB_DEFAULTS.isActive })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_connection_at: Date | null;
}
