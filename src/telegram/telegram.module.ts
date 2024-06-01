import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { MessageHandlerService } from './messageHandler.service';
import { ReactionHandlerService } from './reactionHandler.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, MessageHandlerService, ReactionHandlerService],
})
export class TelegramModule {}
