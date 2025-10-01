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
  PARAMETER = 'parameter',
  RETURN_VALUE = 'return_value',
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
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  component_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: VariableKind })
  kind: VariableKind;

  @Column({ type: 'enum', enum: VariableType })
  type: VariableType;

  @Column({ type: 'boolean', default: false })
  nullable: boolean;

  @Column({ type: 'text', nullable: true })
  placeholder: string | null;

  @Column({ type: 'text', nullable: true })
  validation_regex: string | null;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  // Relations
  @ManyToOne(() => Component, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_id' })
  component: Component;
}
