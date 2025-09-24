import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { UserServicesModule } from './user-services/user-services.module';
import { User } from './users/entities/user.entity';
import { Service } from './services/entities/service.entity';
import { UserService } from './user-services/entities/user-service.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Service, UserService],
        synchronize: true, // creates tables automatically
        logging: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ServicesModule,
    UserServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
