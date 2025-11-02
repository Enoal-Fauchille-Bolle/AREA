import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AreaExecutionsService } from './area-executions.service';
import {
  CreateAreaExecutionDto,
  UpdateAreaExecutionDto,
  AreaExecutionResponseDto,
} from './dto';
import { ExecutionStatus } from './entities/area-execution.entity';

@ApiTags('Area Executions')
@Controller('area-executions')
export class AreaExecutionsController {
  constructor(private readonly areaExecutionsService: AreaExecutionsService) {}

  @ApiOperation({
    summary: 'Create area execution',
    description: 'Creates a new execution record for an AREA',
  })
  @ApiResponse({
    status: 201,
    description: 'Execution successfully created',
    type: AreaExecutionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @Post()
  async create(
    @Body() createAreaExecutionDto: CreateAreaExecutionDto,
  ): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.create(createAreaExecutionDto);
  }

  @ApiOperation({
    summary: 'Get all area executions',
    description: 'Retrieves all area execution records',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all executions',
    type: [AreaExecutionResponseDto],
  })
  @Get()
  async findAll(): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findAll();
  }

  @Get('recent')
  async findRecent(
    @Query('limit', ParseIntPipe) limit: number = 50,
  ): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findRecentExecutions(limit);
  }

  @Get('status/:status')
  async findByStatus(
    @Param('status') status: ExecutionStatus,
  ): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findByStatus(status);
  }

  @Get('long-running')
  async findLongRunning(
    @Query('threshold', ParseIntPipe) thresholdMinutes: number = 30,
  ): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findLongRunningExecutions(
      thresholdMinutes,
    );
  }

  @Get('failed')
  async findFailed(
    @Query('areaId', ParseIntPipe) areaId?: number,
  ): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findFailedExecutions(areaId);
  }

  @ApiOperation({
    summary: 'Get executions by area ID',
    description: 'Retrieves all executions for a specific AREA',
  })
  @ApiParam({
    name: 'areaId',
    description: 'AREA ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of executions for the AREA',
    type: [AreaExecutionResponseDto],
  })
  @Get('area/:areaId')
  async findByAreaId(
    @Param('areaId', ParseIntPipe) areaId: number,
  ): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findByAreaId(areaId);
  }

  @ApiOperation({
    summary: 'Get area execution statistics',
    description: 'Retrieves execution statistics for a specific AREA',
  })
  @ApiParam({
    name: 'areaId',
    description: 'AREA ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Execution statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'integer', example: 100 },
        pending: { type: 'integer', example: 5 },
        running: { type: 'integer', example: 2 },
        completed: { type: 'integer', example: 85 },
        failed: { type: 'integer', example: 7 },
        cancelled: { type: 'integer', example: 1 },
        avgExecutionTimeMs: { type: 'number', example: 1250.5, nullable: true },
      },
    },
  })
  @Get('area/:areaId/stats')
  async getAreaStats(@Param('areaId', ParseIntPipe) areaId: number): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    avgExecutionTimeMs: number | null;
  }> {
    return this.areaExecutionsService.getExecutionStats(areaId);
  }

  @Get('stats')
  async getGlobalStats(): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    avgExecutionTimeMs: number | null;
  }> {
    return this.areaExecutionsService.getExecutionStats();
  }

  @ApiOperation({
    summary: 'Get execution by ID',
    description: 'Retrieves a specific execution by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Execution ID',
    type: 'integer',
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'Execution details',
    type: AreaExecutionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAreaExecutionDto: UpdateAreaExecutionDto,
  ): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.update(id, updateAreaExecutionDto);
  }

  @Patch(':id/start')
  async startExecution(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.startExecution(id);
  }

  @Patch(':id/complete')
  async completeExecution(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { executionResult?: Record<string, any> } = {},
  ): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.completeExecution(
      id,
      body.executionResult,
    );
  }

  @Patch(':id/fail')
  async failExecution(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { errorMessage: string },
  ): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.failExecution(id, body.errorMessage);
  }

  @Patch(':id/cancel')
  async cancelExecution(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.cancelExecution(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.areaExecutionsService.remove(id);
  }

  @Delete('area/:areaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByAreaId(
    @Param('areaId', ParseIntPipe) areaId: number,
  ): Promise<void> {
    return this.areaExecutionsService.removeByAreaId(areaId);
  }

  @Delete('cleanup/old')
  async cleanup(
    @Query('olderThanDays', ParseIntPipe) olderThanDays: number = 30,
  ): Promise<{ deleted: number }> {
    const deleted = await this.areaExecutionsService.cleanup(olderThanDays);
    return { deleted };
  }
}
