import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ComponentsService } from './components.service';
import { CreateComponentDto, UpdateComponentDto, ComponentResponseDto } from './dto';
import { ComponentType } from './entities/component.entity';

@Controller('components')
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createComponentDto: CreateComponentDto): Promise<ComponentResponseDto> {
    return this.componentsService.create(createComponentDto);
  }

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('service_id') serviceId?: string,
    @Query('active') active?: string,
  ): Promise<ComponentResponseDto[]> {
    // Handle query parameters for filtering
    if (active === 'true') {
      return this.componentsService.findActive();
    }
    
    if (type && serviceId) {
      const componentType = type as ComponentType;
      return this.componentsService.findByServiceAndType(parseInt(serviceId), componentType);
    }
    
    if (type === 'action') {
      return this.componentsService.findActions();
    }
    
    if (type === 'reaction') {
      return this.componentsService.findReactions();
    }
    
    if (serviceId) {
      return this.componentsService.findByService(parseInt(serviceId));
    }
    
    return this.componentsService.findAll();
  }

  @Get('actions')
  findActions(): Promise<ComponentResponseDto[]> {
    return this.componentsService.findActions();
  }

  @Get('reactions')
  findReactions(): Promise<ComponentResponseDto[]> {
    return this.componentsService.findReactions();
  }

  @Get('active')
  findActive(): Promise<ComponentResponseDto[]> {
    return this.componentsService.findActive();
  }

  @Get('service/:serviceId')
  findByService(@Param('serviceId', ParseIntPipe) serviceId: number): Promise<ComponentResponseDto[]> {
    return this.componentsService.findByService(serviceId);
  }

  @Get('service/:serviceId/actions')
  findActionsByService(@Param('serviceId', ParseIntPipe) serviceId: number): Promise<ComponentResponseDto[]> {
    return this.componentsService.findByServiceAndType(serviceId, ComponentType.ACTION);
  }

  @Get('service/:serviceId/reactions')
  findReactionsByService(@Param('serviceId', ParseIntPipe) serviceId: number): Promise<ComponentResponseDto[]> {
    return this.componentsService.findByServiceAndType(serviceId, ComponentType.REACTION);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ComponentResponseDto> {
    return this.componentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateComponentDto: UpdateComponentDto,
  ): Promise<ComponentResponseDto> {
    return this.componentsService.update(id, updateComponentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.componentsService.remove(id);
  }
}