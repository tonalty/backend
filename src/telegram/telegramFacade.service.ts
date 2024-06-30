import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ChatMemberHandlerService } from './chatMemberHandler.service';
import { MessageHandlerService } from './messageHandler.service';
import { MyChatMemberHandlerService } from './myChatMemberHandler.service';
import { ReactionHandlerService } from './reactionHandler.service';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramFacade implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramFacade.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly messageHandlerService: MessageHandlerService,
    private readonly reactionHandlerService: ReactionHandlerService,
    private readonly chatMemberHandlerService: ChatMemberHandlerService,
    private readonly myChatMemberHandlerService: MyChatMemberHandlerService,
  ) {}

  onModuleInit() {
    this.telegramService.registerMessageReactionHandler(this.reactionHandlerService);
    this.telegramService.registerMessageHandler(this.messageHandlerService);
    this.telegramService.registerChatMemberHandler(this.chatMemberHandlerService);
    this.telegramService.registerMyChatMemberHandler(this.myChatMemberHandlerService);
    this.telegramService.completeHandlerRegistration();
  }

  onModuleDestroy() {
    this.telegramService.destroyHandlerRegistration();
  }
}
