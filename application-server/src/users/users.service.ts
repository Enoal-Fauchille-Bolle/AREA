import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private nextId = 1;

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Remove password from DTO and create user with hashed password
    const { password, ...userWithoutPassword } = createUserDto;
    
    const user = new User({
      id: this.nextId++,
      ...userWithoutPassword,
      password_hash,
      is_admin: createUserDto.is_admin ?? false,
      is_active: createUserDto.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    this.users.push(user);
    return new UserResponseDto(user);
  }

  findAll(): UserResponseDto[] {
    return this.users.map(user => new UserResponseDto(user));
  }

  findOne(id: number): UserResponseDto | undefined {
    const user = this.users.find((user) => user.id === id);
    return user ? new UserResponseDto(user) : undefined;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  findByUsername(username: string): User | undefined {
    return this.users.find((user) => user.username === username);
  }

  findByUsernamePublic(username: string): UserResponseDto | undefined {
    const user = this.users.find((user) => user.username === username);
    return user ? new UserResponseDto(user) : undefined;
  }

  // Internal method that returns full user with password hash (for authentication)
  findUserForAuth(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    // Handle password update if provided
    let updateData: Partial<User> = { ...updateUserDto };
    if (updateUserDto.password) {
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(updateUserDto.password, saltRounds);
      const { password, ...dataWithoutPassword } = updateUserDto;
      updateData = { ...dataWithoutPassword, password_hash };
    }

    const updatedUser = new User({
      ...this.users[userIndex],
      ...updateData,
      updated_at: new Date(),
    });

    this.users[userIndex] = updatedUser;
    return updatedUser;
  }

  updateLastConnection(id: number): User | null {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex].last_connection_at = new Date();
    this.users[userIndex].updated_at = new Date();
    
    return this.users[userIndex];
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  remove(id: number): boolean {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    return true;
  }
}