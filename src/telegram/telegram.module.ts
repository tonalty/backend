import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CommunityModule } from 'src/communities/community.module';
import { ReferralsService } from 'src/referrals/referrals.service';
import { ChatMemberHandlerService } from './chatMemberHandler.service';
import { MessageHandlerService } from './messageHandler.service';
import { MyChatMemberHandlerService } from './myChatMemberHandler.service';
import { ReactionHandlerService } from './reactionHandler.service';
import { TelegramService } from './telegram.service';
import { TelegramFacade } from './telegramFacade.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [HttpModule, CommunityModule],
  providers: [
    TelegramService,
    MessageHandlerService,
    ReactionHandlerService,
    ChatMemberHandlerService,
    MyChatMemberHandlerService,
    ReferralsService,
    TelegramFacade,
  ],
  controllers: [TelegramController],
})
export class TelegramModule {}
