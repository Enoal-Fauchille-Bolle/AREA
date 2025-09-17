// src/about/about.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { Action } from './entities/action.entity';
import { Reaction } from './entities/reaction.entity';

@Injectable()
export class AboutService {
  constructor(
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Action) private actionRepo: Repository<Action>,
    @InjectRepository(Reaction) private reactionRepo: Repository<Reaction>,
  ) {}

  async getAboutData(clientHost: string) {
    const services = await this.serviceRepo.find();
    const result: {
      name: string;
      actions: { name: string; description: string }[];
      reactions: { name: string; description: string }[];
    }[] = [];

    for (const service of services) {
      const actions = await this.actionRepo.find({ where: { service_id: service.id } });
      const reactions = await this.reactionRepo.find({ where: { service_id: service.id } });
      result.push({
        name: service.name,
        actions: actions.map(a => ({ name: a.name, description: a.description })),
        reactions: reactions.map(r => ({ name: r.name, description: r.description })),
      });
    }

    return {
      client: { host: clientHost },
      server: {
        current_time: Math.floor(Date.now() / 1000),
        services: result,
      },
    };
  }
}
