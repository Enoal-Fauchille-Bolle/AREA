import { Module, forwardRef } from '@nestjs/common';
import { ReactionProcessorService } from './reaction-processor.service';
import { EmailModule } from '../email/email.module';
import { ComponentsModule } from '../components/components.module';
import { DiscordModule } from '../discord/discord.module';
import { GmailReactionsModule } from '../gmail/reactions/gmail-reactions.module';
import { GmailModule } from '../gmail/gmail.module';
import { TwitchReactionsModule } from '../twitch/reactions/twitch-reactions.module';
import { TwitchModule } from '../twitch/twitch.module';
import { SpotifyModule } from '../spotify/spotify.module';

@Module({
  imports: [
    EmailModule,
    ComponentsModule,
    forwardRef(() => DiscordModule),
    GmailReactionsModule,
    forwardRef(() => GmailModule),
    TwitchReactionsModule,
    forwardRef(() => TwitchModule),
    SpotifyModule,
  ],
  providers: [ReactionProcessorService],
  exports: [ReactionProcessorService],
})
export class CommonModule {}
