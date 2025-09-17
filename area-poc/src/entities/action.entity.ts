import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('actions')
export class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  service_id: number;
}
