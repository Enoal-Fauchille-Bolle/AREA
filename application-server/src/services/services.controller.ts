import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, ServiceResponseDto } from './dto';
import { parseIdParam } from '../common/constants';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(): Promise<ServiceResponseDto[]> {
    return this.servicesService.findAll();
  }

  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ServiceResponseDto> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.servicesService.findOne(parsedIntId);
  }

  }

    @Param('id') id: string,
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
    }
  }

  @HttpCode(HttpStatus.NO_CONTENT)
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
    }
  }
}
