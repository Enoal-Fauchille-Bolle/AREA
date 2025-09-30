import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HookState } from './entities/hook-state.entity';
import { CreateHookStateDto, UpdateHookStateDto, HookStateResponseDto } from './dto';

@Injectable()
export class HookStatesService {
  constructor(
    @InjectRepository(HookState)
    private readonly hookStateRepository: Repository<HookState>,
  ) {}

  async create(createHookStateDto: CreateHookStateDto): Promise<HookStateResponseDto> {
    const hookState = this.hookStateRepository.create(createHookStateDto);
    const savedHookState = await this.hookStateRepository.save(hookState);
    return this.toResponseDto(savedHookState);
  }

  async findAll(): Promise<HookStateResponseDto[]> {
    const hookStates = await this.hookStateRepository.find({
      order: { area_id: 'ASC', state_key: 'ASC' },
    });
    return hookStates.map(hookState => this.toResponseDto(hookState));
  }

  async findOne(areaId: number, stateKey: string): Promise<HookStateResponseDto> {
    const hookState = await this.hookStateRepository.findOne({
      where: { area_id: areaId, state_key: stateKey },
    });
    
    if (!hookState) {
      throw new NotFoundException(`HookState with area_id ${areaId} and state_key ${stateKey} not found`);
    }
    
    return this.toResponseDto(hookState);
  }

  async findByArea(areaId: number): Promise<HookStateResponseDto[]> {
    const hookStates = await this.hookStateRepository.find({
      where: { area_id: areaId },
      order: { state_key: 'ASC' },
    });
    
    return hookStates.map(hookState => this.toResponseDto(hookState));
  }

  async findByStateKey(stateKey: string): Promise<HookStateResponseDto[]> {
    const hookStates = await this.hookStateRepository.find({
      where: { state_key: stateKey },
      order: { area_id: 'ASC' },
    });
    
    return hookStates.map(hookState => this.toResponseDto(hookState));
  }

  async findRecentlyChecked(minutes: number = 60): Promise<HookStateResponseDto[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    
    const hookStates = await this.hookStateRepository
      .createQueryBuilder('hook_state')
      .where('hook_state.last_checked_at >= :cutoffTime', { cutoffTime })
      .orderBy('hook_state.last_checked_at', 'DESC')
      .getMany();
    
    return hookStates.map(hookState => this.toResponseDto(hookState));
  }

  async findNeverChecked(): Promise<HookStateResponseDto[]> {
    const hookStates = await this.hookStateRepository
      .createQueryBuilder('hook_state')
      .where('hook_state.last_checked_at IS NULL')
      .orderBy('hook_state.area_id', 'ASC')
      .addOrderBy('hook_state.state_key', 'ASC')
      .getMany();
    
    return hookStates.map(hookState => this.toResponseDto(hookState));
  }

  async update(areaId: number, stateKey: string, updateHookStateDto: UpdateHookStateDto): Promise<HookStateResponseDto> {
    const hookState = await this.hookStateRepository.findOne({
      where: { area_id: areaId, state_key: stateKey },
    });
    
    if (!hookState) {
      throw new NotFoundException(`HookState with area_id ${areaId} and state_key ${stateKey} not found`);
    }

    Object.assign(hookState, updateHookStateDto);
    const updatedHookState = await this.hookStateRepository.save(hookState);
    return this.toResponseDto(updatedHookState);
  }

  async updateStateValue(areaId: number, stateKey: string, stateValue: string): Promise<HookStateResponseDto> {
    return this.update(areaId, stateKey, { state_value: stateValue });
  }

  async updateLastChecked(areaId: number, stateKey: string, lastCheckedAt?: Date): Promise<HookStateResponseDto> {
    const checkTime = lastCheckedAt || new Date();
    return this.update(areaId, stateKey, { last_checked_at: checkTime });
  }

  async upsert(createHookStateDto: CreateHookStateDto): Promise<HookStateResponseDto> {
    const existing = await this.hookStateRepository.findOne({
      where: { 
        area_id: createHookStateDto.area_id, 
        state_key: createHookStateDto.state_key 
      },
    });

    if (existing) {
      Object.assign(existing, createHookStateDto);
      const updated = await this.hookStateRepository.save(existing);
      return this.toResponseDto(updated);
    } else {
      return this.create(createHookStateDto);
    }
  }

  async remove(areaId: number, stateKey: string): Promise<void> {
    const hookState = await this.hookStateRepository.findOne({
      where: { area_id: areaId, state_key: stateKey },
    });
    
    if (!hookState) {
      throw new NotFoundException(`HookState with area_id ${areaId} and state_key ${stateKey} not found`);
    }
    
    await this.hookStateRepository.remove(hookState);
  }

  async removeByArea(areaId: number): Promise<void> {
    const hookStates = await this.hookStateRepository.find({
      where: { area_id: areaId },
    });
    
    if (hookStates.length > 0) {
      await this.hookStateRepository.remove(hookStates);
    }
  }

  async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const result = await this.hookStateRepository
      .createQueryBuilder()
      .delete()
      .from(HookState)
      .where('updated_at < :cutoffTime', { cutoffTime })
      .execute();
    
    return result.affected || 0;
  }

  private toResponseDto(hookState: HookState): HookStateResponseDto {
    return {
      area_id: hookState.area_id,
      state_key: hookState.state_key,
      state_value: hookState.state_value,
      last_checked_at: hookState.last_checked_at,
      created_at: hookState.created_at,
      updated_at: hookState.updated_at,
    };
  }
}