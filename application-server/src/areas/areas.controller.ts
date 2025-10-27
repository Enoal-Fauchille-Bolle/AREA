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
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './dto';
import { parseIdParam } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('areas')
@UseGuards(JwtAuthGuard)
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

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
