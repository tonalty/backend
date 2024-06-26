import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { MessageHandlerService } from './messageHandler.service';
import { ReactionHandlerService } from './reactionHandler.service';
import { ChatMemberHandlerService } from './chatMemberHandler.service';
import { MyChatMemberHandlerService } from './myChatMemberHandler.service';
import { ReferralsService } from 'src/referrals/referrals.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [TelegramController],
  providers: [
    TelegramService,
    MessageHandlerService,
    ReactionHandlerService,
    ChatMemberHandlerService,
    MyChatMemberHandlerService,
    ReferralsService,
  ],
})
export class TelegramModule {}
