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
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, ServiceResponseDto } from './dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  findAll(): Promise<ServiceResponseDto[]> {
    return this.servicesService.findAll();
  }

  @Get('active')
  findActive(): Promise<ServiceResponseDto[]> {
    return this.servicesService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ServiceResponseDto> {
    const parsedIntId = parseInt(id, 10);
    if (isNaN(parsedIntId)) {
      throw new Error('Invalid ID format');
    }
    return this.servicesService.findOne(parsedIntId);
  }

  @Get('by-name/:name')
  findByName(@Param('name') name: string): Promise<ServiceResponseDto> {
    return this.servicesService.findByName(name);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    const parsedIntId = parseInt(id, 10);
    if (isNaN(parsedIntId)) {
      throw new Error('Invalid ID format');
    }
    return this.servicesService.update(parsedIntId, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    const parsedIntId = parseInt(id, 10);
    if (isNaN(parsedIntId)) {
      throw new Error('Invalid ID format');
    }
    return this.servicesService.remove(parsedIntId);
  }
}
