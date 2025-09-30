import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Component } from '../../components/entities/component.entity';

export enum VariableKind {
  INPUT = 'input',
  OUTPUT = 'output',
  PARAMETER = 'parameter',
}

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  EMAIL = 'email',
  URL = 'url',
  JSON = 'json',
}

@Entity('variables')
export class Variable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  component_id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: VariableKind,
  })
  kind: VariableKind;

  @Column({
    type: 'enum',
    enum: VariableType,
    nullable: true,
  })
  type: VariableType | null;

  @Column({ type: 'boolean', default: false })
  nullable: boolean;

  @Column({ type: 'text', nullable: true })
  placeholder: string | null;

  @Column({ type: 'text', nullable: true })
  validation_regex: string | null;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Component, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_id' })
  component: Component;
}