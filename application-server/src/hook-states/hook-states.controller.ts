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
import { HookStatesService } from './hook-states.service';
import { CreateHookStateDto, UpdateHookStateDto, HookStateResponseDto } from './dto';

@Controller('hook-states')
export class HookStatesController {
  constructor(private readonly hookStatesService: HookStatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createHookStateDto: CreateHookStateDto): Promise<HookStateResponseDto> {
    return this.hookStatesService.create(createHookStateDto);
  }

  @Post('upsert')
  @HttpCode(HttpStatus.OK)
  upsert(@Body() createHookStateDto: CreateHookStateDto): Promise<HookStateResponseDto> {
    return this.hookStatesService.upsert(createHookStateDto);
  }

  @Get()
  findAll(
    @Query('area_id') areaId?: string,
    @Query('state_key') stateKey?: string,
    @Query('recent_minutes') recentMinutes?: string,
    @Query('never_checked') neverChecked?: string,
  ): Promise<HookStateResponseDto[]> {
    if (neverChecked === 'true') {
      return this.hookStatesService.findNeverChecked();
    }
    
    if (recentMinutes) {
      return this.hookStatesService.findRecentlyChecked(parseInt(recentMinutes));
    }
    
    if (areaId) {
      return this.hookStatesService.findByArea(parseInt(areaId));
    }
    
    if (stateKey) {
      return this.hookStatesService.findByStateKey(stateKey);
    }
    
    return this.hookStatesService.findAll();
  }

  @Get('area/:areaId')
  findByArea(@Param('areaId', ParseIntPipe) areaId: number): Promise<HookStateResponseDto[]> {
    return this.hookStatesService.findByArea(areaId);
  }

  @Get('state-key/:stateKey')
  findByStateKey(@Param('stateKey') stateKey: string): Promise<HookStateResponseDto[]> {
    return this.hookStatesService.findByStateKey(stateKey);
  }

  @Get('recent')
  findRecentlyChecked(@Query('minutes') minutes?: string): Promise<HookStateResponseDto[]> {
    const minutesNum = minutes ? parseInt(minutes) : 60;
    return this.hookStatesService.findRecentlyChecked(minutesNum);
  }

  @Get('never-checked')
  findNeverChecked(): Promise<HookStateResponseDto[]> {
    return this.hookStatesService.findNeverChecked();
  }

  @Get(':areaId/:stateKey')
  findOne(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Param('stateKey') stateKey: string,
  ): Promise<HookStateResponseDto> {
    return this.hookStatesService.findOne(areaId, stateKey);
  }

  @Patch(':areaId/:stateKey')
  update(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Param('stateKey') stateKey: string,
    @Body() updateHookStateDto: UpdateHookStateDto,
  ): Promise<HookStateResponseDto> {
    return this.hookStatesService.update(areaId, stateKey, updateHookStateDto);
  }

  @Patch(':areaId/:stateKey/value')
  updateStateValue(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Param('stateKey') stateKey: string,
    @Body() body: { state_value: string },
  ): Promise<HookStateResponseDto> {
    return this.hookStatesService.updateStateValue(areaId, stateKey, body.state_value);
  }

  @Patch(':areaId/:stateKey/check')
  updateLastChecked(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Param('stateKey') stateKey: string,
    @Body() body?: { last_checked_at?: string },
  ): Promise<HookStateResponseDto> {
    const lastCheckedAt = body?.last_checked_at ? new Date(body.last_checked_at) : new Date();
    return this.hookStatesService.updateLastChecked(areaId, stateKey, lastCheckedAt);
  }

  @Delete(':areaId/:stateKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Param('stateKey') stateKey: string,
  ): Promise<void> {
    return this.hookStatesService.remove(areaId, stateKey);
  }

  @Delete('area/:areaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeByArea(@Param('areaId', ParseIntPipe) areaId: number): Promise<void> {
    return this.hookStatesService.removeByArea(areaId);
  }

  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  cleanup(@Query('older_than_days') olderThanDays?: string): Promise<{ deleted: number }> {
    const days = olderThanDays ? parseInt(olderThanDays) : 30;
    return this.hookStatesService.cleanup(days).then(deleted => ({ deleted }));
  }
}