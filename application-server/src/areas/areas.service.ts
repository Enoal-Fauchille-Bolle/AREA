import {
  Injectable,
  NotFoundException,
  // ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './entities/area.entity';
import { CreateAreaDto, UpdateAreaDto } from './dto';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private areasRepository: Repository<Area>,
  ) {}

  async create(userId: number, createAreaDto: CreateAreaDto): Promise<Area> {
    try {
      console.log('Creating area with:', { userId, createAreaDto });
      const area = this.areasRepository.create({
        ...createAreaDto,
        user_id: userId,
      });
      console.log('Area entity created:', area);

      const savedArea = await this.areasRepository.save(area);
      console.log('Area saved:', savedArea);
      return savedArea;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  }

  async findAll(userId: number): Promise<Area[]> {
    return this.areasRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Area> {
    const area = await this.areasRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!area) {
      throw new NotFoundException('Area not found');
    }

    return area;
  }

  async update(
    id: number,
    userId: number,
    updateAreaDto: UpdateAreaDto,
  ): Promise<Area> {
    const area = await this.findOne(id, userId);

    Object.assign(area, updateAreaDto);
    return this.areasRepository.save(area);
  }

  async remove(id: number, userId: number): Promise<void> {
    const area = await this.findOne(id, userId);
    await this.areasRepository.remove(area);
  }

  async toggleActive(id: number, userId: number): Promise<Area> {
    const area = await this.findOne(id, userId);
    area.is_active = !area.is_active;
    return this.areasRepository.save(area);
  }

  async incrementTriggerCount(id: number): Promise<void> {
    await this.areasRepository.update(id, {
      triggered_count: () => 'triggered_count + 1',
      last_triggered_at: new Date(),
    });
  }
}
