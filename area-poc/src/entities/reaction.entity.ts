import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reactions')
export class Reaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  service_id: number;
}
