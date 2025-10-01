import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './dto';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  async create(@Request() req, @Body() createAreaDto: CreateAreaDto) {
    try {
      // For testing without auth, use a default user ID
      const userId = req.user?.id || 1;
      console.log('Controller: Creating area', { userId, createAreaDto });
      const area = await this.areasService.create(userId, createAreaDto);
      console.log('Controller: Area created', area);
      return area; // Return raw area for now
    } catch (error) {
      console.error('Controller error:', error);
      return { error: error.message, stack: error.stack };
    }
  }

  @Get()
  async findAll(@Request() req) {
    try {
      const userId = req.user?.id || 1;
      const areas = await this.areasService.findAll(userId);
      return areas;
    } catch (error) {
      console.error('Controller GET error:', error);
      return { error: error.message };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user?.id || 1;
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        throw new Error('Invalid ID format');
      }
      const area = await this.areasService.findOne(parsedId, userId);
      return area;
    } catch (error) {
      return { error: error.message };
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateAreaDto: UpdateAreaDto,
  ): Promise<AreaResponseDto> {
    const parsedId = parseInt(id, 10);
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

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user?.id || 1;
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        throw new Error('Invalid ID format');
      }
      await this.areasService.remove(parsedId, userId);
      return { message: 'Area deleted successfully' };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Patch(':id/toggle')
  async toggleActive(
    @Param('id') id: string,
    @Request() req,
  ): Promise<AreaResponseDto> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      throw new Error('Invalid ID format');
    }
    const area = await this.areasService.toggleActive(parsedId, req.user.id);
    return new AreaResponseDto(area);
  }
}
