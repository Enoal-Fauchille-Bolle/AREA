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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AreaParametersService } from './area-parameters.service';
import {
  CreateAreaParameterDto,
  UpdateAreaParameterDto,
  AreaParameterResponseDto,
} from './dto';

@ApiTags('Area Parameters')
@Controller('area-parameters')
export class AreaParametersController {
  constructor(private readonly areaParametersService: AreaParametersService) {}

  @ApiOperation({
    summary: 'Create area parameter',
    description: 'Creates a new parameter for an AREA component',
  })
  @ApiResponse({
    status: 201,
    description: 'Parameter successfully created',
    type: AreaParameterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createAreaParameterDto: CreateAreaParameterDto,
  ): Promise<AreaParameterResponseDto> {
    return this.areaParametersService.create(createAreaParameterDto);
  }

  @ApiOperation({
    summary: 'Get all area parameters',
    description:
      'Retrieves all area parameters. Supports filtering by area ID, variable ID, or templates',
  })
  @ApiQuery({
    name: 'area_id',
    required: false,
    type: 'integer',
    description: 'Filter by AREA ID',
  })
  @ApiQuery({
    name: 'variable_id',
    required: false,
    type: 'integer',
    description: 'Filter by variable ID',
  })
  @ApiQuery({
    name: 'templates',
    required: false,
    type: 'boolean',
    description: 'Filter template parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of area parameters',
    type: [AreaParameterResponseDto],
  })
  @Get()
  findAll(
    @Query('area_id') areaId?: string,
    @Query('variable_id') variableId?: string,
    @Query('templates') templates?: string,
  ): Promise<AreaParameterResponseDto[]> {
    // Handle query parameters for filtering
    if (templates === 'true') {
      if (areaId) {
        return this.areaParametersService.findTemplatesByArea(parseInt(areaId));
      }
      return this.areaParametersService.findTemplates();
    }

    if (areaId) {
      return this.areaParametersService.findByArea(parseInt(areaId));
    }

    if (variableId) {
      return this.areaParametersService.findByVariable(parseInt(variableId));
    }

    return this.areaParametersService.findAll();
  }

  @Get('templates')
  findTemplates(): Promise<AreaParameterResponseDto[]> {
    return this.areaParametersService.findTemplates();
  }

  @Get('area/:areaId')
  findByArea(
    @Param('areaId', ParseIntPipe) areaId: number,
  ): Promise<AreaParameterResponseDto[]> {
    return this.areaParametersService.findByArea(areaId);
  }

  @Get('area/:areaId/templates')
  findTemplatesByArea(
    @Param('areaId', ParseIntPipe) areaId: number,
  ): Promise<AreaParameterResponseDto[]> {
    return this.areaParametersService.findTemplatesByArea(areaId);
  }

  @Get('variable/:variableId')
  findByVariable(
    @Param('variableId', ParseIntPipe) variableId: number,
  ): Promise<AreaParameterResponseDto[]> {
    return this.areaParametersService.findByVariable(variableId);
  }

  @Get(':areaId/:variableId')
  findOne(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Param('variableId', ParseIntPipe) variableId: number,
  ): Promise<AreaParameterResponseDto> {
    return this.areaParametersService.findOne(areaId, variableId);
  }

  @Patch(':areaId/:variableId')
  update(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Param('variableId', ParseIntPipe) variableId: number,
    @Body() updateAreaParameterDto: UpdateAreaParameterDto,
  ): Promise<AreaParameterResponseDto> {
    return this.areaParametersService.update(
      areaId,
      variableId,
      updateAreaParameterDto,
    );
  }

  @Patch(':areaId/:variableId/value')
  updateValue(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Param('variableId', ParseIntPipe) variableId: number,
    @Body() body: { value: string },
  ): Promise<AreaParameterResponseDto> {
    return this.areaParametersService.updateValue(
      areaId,
      variableId,
      body.value,
    );
  }

  @Post('area/:areaId/bulk')
  bulkCreateOrUpdate(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Body()
    body: {
      parameters: {
        variable_id: number;
        value: string;
        is_template?: boolean;
      }[];
    },
  ): Promise<AreaParameterResponseDto[]> {
    return this.areaParametersService.bulkCreateOrUpdate(
      areaId,
      body.parameters,
    );
  }

  @Delete(':areaId/:variableId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Param('variableId', ParseIntPipe) variableId: number,
  ): Promise<void> {
    return this.areaParametersService.remove(areaId, variableId);
  }

  @Delete('area/:areaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeByArea(@Param('areaId', ParseIntPipe) areaId: number): Promise<void> {
    return this.areaParametersService.removeByArea(areaId);
  }

  @Delete('variable/:variableId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeByVariable(
    @Param('variableId', ParseIntPipe) variableId: number,
  ): Promise<void> {
    return this.areaParametersService.removeByVariable(variableId);
  }
}
