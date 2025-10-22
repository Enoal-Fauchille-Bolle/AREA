// Type for component parameter configs
interface ComponentParameter {
  name: string;
  description: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validation?: string;
}
import {
  Injectable,
  NotFoundException,
  // ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './entities/area.entity';
import { CreateAreaDto, UpdateAreaDto } from './dto';
import { VariablesService } from '../variables/variables.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { ComponentsService } from '../components/components.service';
import { ComponentResponseDto } from '../components/dto/component-response.dto';
import {
  VariableKind,
  VariableType,
} from '../variables/entities/variable.entity';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private areasRepository: Repository<Area>,
    private variablesService: VariablesService,
    private areaParametersService: AreaParametersService,
    private componentsService: ComponentsService,
  ) {}

  async createWithParameters(
    userId: number,
    createAreaDto: CreateAreaDto,
    parameters: { [parameterName: string]: string },
  ): Promise<Area> {
    try {
      console.log('Creating area with parameters:', {
        userId,
        createAreaDto,
        parameters,
      });
      const area = await this.create(userId, createAreaDto);
      console.log('Area created:', area);
      const actionComponent = await this.componentsService.findOne(
        createAreaDto.component_action_id,
      );
      const reactionComponent = await this.componentsService.findOne(
        createAreaDto.component_reaction_id,
      );
      console.log('Components:', {
        actionComponent: actionComponent.name,
        reactionComponent: reactionComponent.name,
      });
      await this.createVariablesAndParameters(
        area.id,
        actionComponent,
        reactionComponent,
        parameters,
      );

      return area;
    } catch (error) {
      console.error('Service createWithParameters error:', error);
      throw error;
    }
  }

  private async createVariablesAndParameters(
    areaId: number,
    actionComponent: ComponentResponseDto,
    reactionComponent: ComponentResponseDto,
    parameters: { [parameterName: string]: string },
  ): Promise<void> {
    const componentConfigs = this.getComponentParameterConfigs();
    const actionConfig = componentConfigs.find(
      (c) => c.componentName === actionComponent.name,
    );
    if (actionConfig) {
      await this.createVariablesForComponent(
        actionComponent.id,
        actionConfig.parameters,
        areaId,
        parameters,
      );
    }
    const reactionConfig = componentConfigs.find(
      (c) => c.componentName === reactionComponent.name,
    );
    if (reactionConfig) {
      await this.createVariablesForComponent(
        reactionComponent.id,
        reactionConfig.parameters,
        areaId,
        parameters,
      );
    }
  }

  private async createVariablesForComponent(
    componentId: number,
    parameterConfigs: ComponentParameter[],
    areaId: number,
    userParameters: { [parameterName: string]: string },
  ): Promise<void> {
    for (const paramConfig of parameterConfigs) {
      const variable = await this.variablesService.create({
        component_id: componentId,
        name: paramConfig.name,
        description: paramConfig.description,
        kind: VariableKind.PARAMETER,
        type: this.mapStringToVariableType(paramConfig.type),
        nullable: !paramConfig.required,
        placeholder: paramConfig.placeholder,
        validation_regex: paramConfig.validation,
        display_order: 1,
      });

      const userValue = userParameters[paramConfig.name];
      if (userValue && userValue.trim()) {
        await this.areaParametersService.create({
          area_id: areaId,
          variable_id: variable.id,
          value: userValue,
        });
      }
    }
  }

  private mapStringToVariableType(type: string): VariableType {
    switch (type) {
      case 'number':
        return VariableType.NUMBER;
      case 'email':
        return VariableType.EMAIL;
      case 'url':
        return VariableType.URL;
      default:
        return VariableType.STRING;
    }
  }

  private getComponentParameterConfigs() {
    return [
      {
        componentName: 'daily_timer',
        parameters: [
          {
            name: 'time',
            description: 'Time of day to trigger (HH:MM format, 24-hour)',
            type: 'string',
            required: true,
            placeholder: '09:30',
            validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
          },
        ],
      },
      {
        componentName: 'weekly_timer',
        parameters: [
          {
            name: 'time',
            description: 'Time of day to trigger (HH:MM format, 24-hour)',
            type: 'string',
            required: true,
            placeholder: '09:30',
            validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
          },
          {
            name: 'days_of_week',
            description: 'Days of week to trigger (comma-separated)',
            type: 'string',
            required: true,
            placeholder: 'monday,friday',
          },
        ],
      },
      {
        componentName: 'monthly_timer',
        parameters: [
          {
            name: 'time',
            description: 'Time of day to trigger (HH:MM format, 24-hour)',
            type: 'string',
            required: true,
            placeholder: '09:30',
            validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
          },
          {
            name: 'days_of_month',
            description:
              'Days of month to trigger (comma-separated: 1,15,30 or "last" for last day)',
            type: 'string',
            required: true,
            placeholder: '1,15',
          },
        ],
      },
      {
        componentName: 'interval_timer',
        parameters: [
          {
            name: 'interval_minutes',
            description: 'Interval in minutes between triggers',
            type: 'number',
            required: true,
            placeholder: '30',
          },
          {
            name: 'start_time',
            description: 'Time to start the interval (HH:MM format, 24-hour)',
            type: 'string',
            required: true,
            placeholder: '09:00',
            validation: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
          },
        ],
      },
      {
        componentName: 'send_email',
        parameters: [
          {
            name: 'to',
            description: 'Recipient email address',
            type: 'email',
            required: true,
            placeholder: 'user@example.com',
            validation: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          },
          {
            name: 'subject',
            description: 'Email subject line',
            type: 'string',
            required: false,
            placeholder: 'AREA Notification',
          },
          {
            name: 'body',
            description: 'Email message body',
            type: 'string',
            required: false,
            placeholder: 'Your AREA was triggered successfully.',
          },
        ],
      },
    ];
  }

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
      relations: ['componentAction', 'componentAction.service', 'componentReaction', 'componentReaction.service'],
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

  async findByActionComponent(componentName: string): Promise<Area[]> {
    return this.areasRepository
      .createQueryBuilder('area')
      .innerJoin(
        'components',
        'action_component',
        'action_component.id = area.component_action_id',
      )
      .where('action_component.name = :componentName', { componentName })
      .andWhere('area.is_active = true')
      .getMany();
  }
}
