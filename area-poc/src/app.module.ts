import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { AboutController } from './about/about.controller';
import { AboutService } from './about/about.service';
import { MinuteGateway } from './minute.gateway';
import { Service } from './entities/service.entity';
import { Action } from './entities/action.entity';
import { Reaction } from './entities/reaction.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'area',
      password: 'area123',
      database: 'areadb',
      entities: [User, Service, Action, Reaction],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Service, Action, Reaction]),
  ],
  providers: [UserService, AboutService, MinuteGateway],
  controllers: [UserController, AboutController],
})
export class AppModule {}
