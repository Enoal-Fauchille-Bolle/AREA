import { DB_COLUMN_LENGTHS } from '../../../config';
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Service } from '../../../services/entities/service.entity';

@Entity('user_oauth2_accounts')
export class UserOAuth2Account {
  // Foreign key to Service
  @PrimaryColumn({ type: 'int' })
  service_id: number;

  @PrimaryColumn({
    type: 'varchar',
    length: DB_COLUMN_LENGTHS.oauth2ProviderUserId,
  })
  service_account_id: string;

  // Foreign Key to User
  @Column({ type: 'int' })
  user_id: number;

  @Column({
    type: 'varchar',
    length: DB_COLUMN_LENGTHS.email,
    nullable: true,
  })
  email: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
