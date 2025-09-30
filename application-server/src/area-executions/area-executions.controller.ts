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
import { AreaExecutionsService } from './area-executions.service';
import { CreateAreaExecutionDto, UpdateAreaExecutionDto, AreaExecutionResponseDto } from './dto';
import { ExecutionStatus } from './entities/area-execution.entity';

@Controller('area-executions')
export class AreaExecutionsController {
  constructor(private readonly areaExecutionsService: AreaExecutionsService) {}

  @Post()
  async create(@Body() createAreaExecutionDto: CreateAreaExecutionDto): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.create(createAreaExecutionDto);
  }

  @Get()
  async findAll(): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findAll();
  }

  @Get('recent')
  async findRecent(@Query('limit', ParseIntPipe) limit: number = 50): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findRecentExecutions(limit);
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: ExecutionStatus): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findByStatus(status);
  }

  @Get('long-running')
  async findLongRunning(
    @Query('threshold', ParseIntPipe) thresholdMinutes: number = 30,
  ): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findLongRunningExecutions(thresholdMinutes);
  }

  @Get('failed')
  async findFailed(@Query('areaId', ParseIntPipe) areaId?: number): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findFailedExecutions(areaId);
  }

  @Get('area/:areaId')
  async findByAreaId(@Param('areaId', ParseIntPipe) areaId: number): Promise<AreaExecutionResponseDto[]> {
    return this.areaExecutionsService.findByAreaId(areaId);
  }

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

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AreaExecutionResponseDto> {
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
  async startExecution(@Param('id', ParseIntPipe) id: number): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.startExecution(id);
  }

  @Patch(':id/complete')
  async completeExecution(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { executionResult?: Record<string, any> } = {},
  ): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.completeExecution(id, body.executionResult);
  }

  @Patch(':id/fail')
  async failExecution(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { errorMessage: string },
  ): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.failExecution(id, body.errorMessage);
  }

  @Patch(':id/cancel')
  async cancelExecution(@Param('id', ParseIntPipe) id: number): Promise<AreaExecutionResponseDto> {
    return this.areaExecutionsService.cancelExecution(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.areaExecutionsService.remove(id);
  }

  @Delete('area/:areaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByAreaId(@Param('areaId', ParseIntPipe) areaId: number): Promise<void> {
    return this.areaExecutionsService.removeByAreaId(areaId);
  }

  @Delete('cleanup/old')
  async cleanup(@Query('olderThanDays', ParseIntPipe) olderThanDays: number = 30): Promise<{ deleted: number }> {
    const deleted = await this.areaExecutionsService.cleanup(olderThanDays);
    return { deleted };
  }
}