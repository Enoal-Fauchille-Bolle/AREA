import { Module } from '@nestjs/common';
import { ReactionProcessorService } from './reaction-processor.service';
import { EmailModule } from '../email/email.module';
import { ComponentsModule } from '../components/components.module';
import { DiscordModule } from '../discord/discord.module';

@Module({
  imports: [EmailModule, ComponentsModule, DiscordModule],
  providers: [ReactionProcessorService],
  exports: [ReactionProcessorService],
})
export class CommonModule {}
