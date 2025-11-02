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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ComponentsService } from './components.service';
import {
  CreateComponentDto,
  UpdateComponentDto,
  ComponentResponseDto,
} from './dto';
import { ComponentType } from './entities/component.entity';

@ApiTags('Components')
@Controller('components')
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @ApiOperation({
    summary: 'Create component',
    description: 'Creates a new action or reaction component for a service',
  })
  @ApiResponse({
    status: 201,
    description: 'Component successfully created',
    type: ComponentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createComponentDto: CreateComponentDto,
  ): Promise<ComponentResponseDto> {
    return this.componentsService.create(createComponentDto);
  }

  @ApiOperation({
    summary: 'Get all components',
    description:
      'Retrieves all components. Supports filtering by type, service, and active status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ComponentType,
    description: 'Filter by component type (action/reaction)',
  })
  @ApiQuery({
    name: 'service_id',
    required: false,
    type: 'integer',
    description: 'Filter by service ID',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: 'boolean',
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of components',
    type: [ComponentResponseDto],
  })
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
      return this.componentsService.findByServiceAndType(
        parseInt(serviceId),
        componentType,
      );
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

  @ApiOperation({
    summary: 'Get all action components',
    description: 'Retrieves all action components across all services',
  })
  @ApiResponse({
    status: 200,
    description: 'List of action components',
    type: [ComponentResponseDto],
  })
  @Get('actions')
  findActions(): Promise<ComponentResponseDto[]> {
    return this.componentsService.findActions();
  }

  @ApiOperation({
    summary: 'Get all reaction components',
    description: 'Retrieves all reaction components across all services',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reaction components',
    type: [ComponentResponseDto],
  })
  @Get('reactions')
  findReactions(): Promise<ComponentResponseDto[]> {
    return this.componentsService.findReactions();
  }

  @ApiOperation({
    summary: 'Get all active components',
    description: 'Retrieves all components that are currently active',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active components',
    type: [ComponentResponseDto],
  })
  @Get('active')
  findActive(): Promise<ComponentResponseDto[]> {
    return this.componentsService.findActive();
  }

  @Get('service/:serviceId')
  findByService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<ComponentResponseDto[]> {
    return this.componentsService.findByService(serviceId);
  }

  @Get('service/:serviceId/actions')
  findActionsByService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<ComponentResponseDto[]> {
    return this.componentsService.findByServiceAndType(
      serviceId,
      ComponentType.ACTION,
    );
  }

  @Get('service/:serviceId/reactions')
  findReactionsByService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<ComponentResponseDto[]> {
    return this.componentsService.findByServiceAndType(
      serviceId,
      ComponentType.REACTION,
    );
  }

  @ApiOperation({
    summary: 'Get component by ID',
    description: 'Retrieves a specific component by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Component ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Component details',
    type: ComponentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Component not found' })
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ComponentResponseDto> {
    return this.componentsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update component',
    description: 'Updates an existing component',
  })
  @ApiParam({
    name: 'id',
    description: 'Component ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Component successfully updated',
    type: ComponentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Component not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateComponentDto: UpdateComponentDto,
  ): Promise<ComponentResponseDto> {
    return this.componentsService.update(id, updateComponentDto);
  }

  @ApiOperation({
    summary: 'Delete component',
    description: 'Deletes a component by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Component ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Component successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Component not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.componentsService.remove(id);
  }
}
