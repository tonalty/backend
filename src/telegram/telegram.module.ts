import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { MessageHandlerService } from './messageHandler.service';
import { ReactionHandlerService } from './reactionHandler.service';
import { ChatMemberHandlerService } from './chatMemberHandler.service';
import { MyChatMemberHandlerService } from './myChatMemberHandler.service';

@Module({
  controllers: [TelegramController],
  providers: [
    TelegramService,
    MessageHandlerService,
    ReactionHandlerService,
    ChatMemberHandlerService,
    MyChatMemberHandlerService,
  ],
})
export class TelegramModule {}
