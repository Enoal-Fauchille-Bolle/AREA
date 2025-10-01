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
import { VariablesService } from './variables.service';
import {
  CreateVariableDto,
  UpdateVariableDto,
  VariableResponseDto,
} from './dto';
import { VariableKind, VariableType } from './entities/variable.entity';

@Controller('variables')
export class VariablesController {
  constructor(private readonly variablesService: VariablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createVariableDto: CreateVariableDto,
  ): Promise<VariableResponseDto> {
    return this.variablesService.create(createVariableDto);
  }

  @Get()
  findAll(
    @Query('kind') kind?: string,
    @Query('component_id') componentId?: string,
    @Query('type') type?: string,
    @Query('required') required?: string,
  ): Promise<VariableResponseDto[]> {
    // Handle query parameters for filtering
    if (required === 'true') {
      return this.variablesService.findRequired();
    }

    if (kind && componentId) {
      const variableKind = kind as VariableKind;
      return this.variablesService.findByComponentAndKind(
        parseInt(componentId),
        variableKind,
      );
    }

    if (kind === 'input') {
      return this.variablesService.findInputs();
    }

    if (kind === 'output') {
      return this.variablesService.findOutputs();
    }

    if (kind === 'parameter') {
      return this.variablesService.findParameters();
    }

    if (componentId) {
      return this.variablesService.findByComponent(parseInt(componentId));
    }

    if (type) {
      const variableType = type as VariableType;
      return this.variablesService.findByType(variableType);
    }

    return this.variablesService.findAll();
  }

  @Get('inputs')
  findInputs(): Promise<VariableResponseDto[]> {
    return this.variablesService.findInputs();
  }

  @Get('outputs')
  findOutputs(): Promise<VariableResponseDto[]> {
    return this.variablesService.findOutputs();
  }

  @Get('parameters')
  findParameters(): Promise<VariableResponseDto[]> {
    return this.variablesService.findParameters();
  }

  @Get('required')
  findRequired(): Promise<VariableResponseDto[]> {
    return this.variablesService.findRequired();
  }

  @Get('component/:componentId')
  findByComponent(
    @Param('componentId', ParseIntPipe) componentId: number,
  ): Promise<VariableResponseDto[]> {
    return this.variablesService.findByComponent(componentId);
  }

  @Get('component/:componentId/inputs')
  findInputsByComponent(
    @Param('componentId', ParseIntPipe) componentId: number,
  ): Promise<VariableResponseDto[]> {
    return this.variablesService.findInputsByComponent(componentId);
  }

  @Get('component/:componentId/outputs')
  findOutputsByComponent(
    @Param('componentId', ParseIntPipe) componentId: number,
  ): Promise<VariableResponseDto[]> {
    return this.variablesService.findOutputsByComponent(componentId);
  }

  @Get('component/:componentId/parameters')
  findParametersByComponent(
    @Param('componentId', ParseIntPipe) componentId: number,
  ): Promise<VariableResponseDto[]> {
    return this.variablesService.findParametersByComponent(componentId);
  }

  @Get('type/:type')
  findByType(
    @Param('type') type: VariableType,
  ): Promise<VariableResponseDto[]> {
    return this.variablesService.findByType(type);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<VariableResponseDto> {
    return this.variablesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVariableDto: UpdateVariableDto,
  ): Promise<VariableResponseDto> {
    return this.variablesService.update(id, updateVariableDto);
  }

  @Patch('component/:componentId/reorder')
  reorderVariables(
    @Param('componentId', ParseIntPipe) componentId: number,
    @Body() body: { variableIds: number[] },
  ): Promise<VariableResponseDto[]> {
    return this.variablesService.reorderVariables(
      componentId,
      body.variableIds,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.variablesService.remove(id);
  }

  @Delete('component/:componentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeByComponent(
    @Param('componentId', ParseIntPipe) componentId: number,
  ): Promise<void> {
    return this.variablesService.removeByComponent(componentId);
  }
}
