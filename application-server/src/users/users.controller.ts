import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // Check if user with email already exists
    const existingUserByEmail = await this.usersService.findByEmail(createUserDto.email);
    if (existingUserByEmail) {
      throw new HttpException(
        'User with this email already exists',
        HttpStatus.CONFLICT,
      );
    }

    // Check if user with username already exists
    const existingUserByUsername = await this.usersService.findByUsername(createUserDto.username);
    if (existingUserByUsername) {
      throw new HttpException(
        'User with this username already exists',
        HttpStatus.CONFLICT,
      );
    }

    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(+id, updateUserDto);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Patch(':id/last-connection')
  async updateLastConnection(@Param('id') id: string) {
    const user = await this.usersService.updateLastConnection(+id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'Last connection updated successfully', user };
  }

  @Get('by-username/:username')
  async findByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsernamePublic(username);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const success = await this.usersService.remove(+id);
    if (!success) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'User deleted successfully' };
  }
}