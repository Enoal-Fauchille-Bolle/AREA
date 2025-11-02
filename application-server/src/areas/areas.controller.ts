import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  UnauthorizedException,
  // HttpCode,
  // HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './dto';
import { parseIdParam } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Areas')
@ApiBearerAuth()
@Controller('areas')
@UseGuards(JwtAuthGuard)
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @ApiOperation({
    summary: 'Create AREA with parameters',
    description:
      'Creates a new AREA (Action-Reaction) with its associated parameters in a single request',
  })
  @ApiResponse({
    status: 201,
    description: 'AREA and parameters successfully created',
    type: AreaResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiBody({
    description: 'AREA and parameters data',
    schema: {
      type: 'object',
      properties: {
        area: { $ref: '#/components/schemas/CreateAreaDto' },
        parameters: {
          type: 'object',
          additionalProperties: { type: 'string' },
          example: { repository_name: 'my-repo', branch: 'main' },
        },
      },
    },
  })
  @Post('create-with-parameters')
  async createWithParameters(
    @Request() req: { user: { id: number } },
    @Body()
    createAreaData: {
      area: CreateAreaDto;
      parameters: { [parameterName: string]: string };
    },
  ) {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = req.user.id;
      console.log('Controller: Creating area with parameters', {
        userId,
        createAreaData,
      });
      const area = await this.areasService.createWithParameters(
        userId,
        createAreaData.area,
        createAreaData.parameters,
      );
      console.log('Controller: Area with parameters created', area);
      return area;
    } catch (error) {
      console.error('Controller create-with-parameters error:', error);
      const err = error as Error;
      return { error: err.message, stack: err.stack };
    }
  }

  @ApiOperation({
    summary: 'Create AREA',
    description:
      'Creates a new AREA (Action-Reaction). Supports both simple creation and creation with parameters',
  })
  @ApiResponse({
    status: 201,
    description: 'AREA successfully created',
    type: AreaResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @Post()
  async create(
    @Request() req: { user: { id: number } },
    @Body()
    body:
      | CreateAreaDto
      | {
          area: CreateAreaDto;
          parameters: { [parameterName: string]: string };
        },
  ) {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = req.user.id;

      // Check if the request has the create-with-parameters format
      if ('area' in body && 'parameters' in body) {
        // Handle the create-with-parameters format
        return await this.areasService.createWithParameters(
          userId,
          body.area,
          body.parameters,
        );
      }

      // Handle regular format
      console.log('Controller: Creating area', { userId, createAreaDto: body });
      const area = await this.areasService.create(userId, body);
      console.log('Controller: Area created', area);
      return area;
    } catch (error) {
      console.error('Controller error:', error);
      const err = error as Error;
      return { error: err.message, stack: err.stack };
    }
  }

  @ApiOperation({
    summary: 'Get all user AREAs',
    description:
      'Retrieves all AREAs (Action-Reaction automations) belonging to the authenticated user. ' +
      'Each AREA represents an automation that triggers a reaction when an action occurs. ' +
      'Returns complete AREA information including trigger status, execution counts, and timestamps.',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of user AREAs with full details (name, description, active status, component IDs, execution statistics)',
    type: [AreaResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @Get()
  async findAll(@Request() req: { user: { id: number } }) {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = req.user.id;
      const areas = await this.areasService.findAll(userId);
      return areas;
    } catch (error) {
      console.error('Controller GET error:', error);
      const err = error as Error;
      return { error: err.message };
    }
  }

  @ApiOperation({
    summary: 'Get AREA by ID',
    description:
      'Retrieves a specific AREA by its ID (must belong to authenticated user). ' +
      'Returns complete AREA information including the action component (trigger), ' +
      'reaction component (response), configuration, execution statistics, and current status. ' +
      'Use this endpoint to get detailed information about a single automation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the AREA',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'Complete AREA details including component IDs, parameters, execution count, and last triggered timestamp',
    type: AreaResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'AREA not found or does not belong to the authenticated user',
  })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
  ) {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = req.user.id;
      const parsedId = parseIdParam(id);
      if (isNaN(parsedId)) {
        throw new Error('Invalid ID format');
      }
      const area = await this.areasService.findOne(parsedId, userId);
      return area;
    } catch (error) {
      const err = error as Error;
      return { error: err.message };
    }
  }

  @ApiOperation({
    summary: 'Update AREA',
    description: 'Updates an existing AREA (must belong to authenticated user)',
  })
  @ApiParam({ name: 'id', description: 'AREA ID', type: 'integer', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'AREA successfully updated',
    type: AreaResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'AREA not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
    @Body() updateAreaDto: UpdateAreaDto,
  ): Promise<AreaResponseDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const parsedId = parseIdParam(id);
    if (isNaN(parsedId)) {
      throw new Error('Invalid ID format');
    }
    const area = await this.areasService.update(
      parsedId,
      req.user.id,
      updateAreaDto,
    );
    return new AreaResponseDto(area);
  }

  @ApiOperation({
    summary: 'Delete AREA',
    description: 'Deletes an AREA by ID (must belong to authenticated user)',
  })
  @ApiParam({ name: 'id', description: 'AREA ID', type: 'integer', example: 1 })
  @ApiResponse({ status: 200, description: 'AREA successfully deleted' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'AREA not found' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
  ) {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }
      const userId = req.user.id;
      const parsedId = parseIdParam(id);
      if (isNaN(parsedId)) {
        throw new Error('Invalid ID format');
      }
      await this.areasService.remove(parsedId, userId);
      return { message: 'Area deleted successfully' };
    } catch (error) {
      const err = error as Error;
      return { error: err.message };
    }
  }

  @ApiOperation({
    summary: 'Toggle AREA active status',
    description: 'Toggles the active/inactive status of an AREA',
  })
  @ApiParam({ name: 'id', description: 'AREA ID', type: 'integer', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'AREA status toggled successfully',
    type: AreaResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 404, description: 'AREA not found' })
  @Patch(':id/toggle')
  async toggleActive(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
  ): Promise<AreaResponseDto> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const parsedId = parseIdParam(id);
    if (isNaN(parsedId)) {
      throw new Error('Invalid ID format');
    }
    const area = await this.areasService.toggleActive(parsedId, req.user.id);
    return new AreaResponseDto(area);
  }
}
