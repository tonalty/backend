import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram/telegram.service';
import { MessageHandlerService } from './telegram/messageHandler.service';
import { ReactionHandlerService } from './telegram/reactionHandler.service';
import { ChatMemberHandlerService } from './telegram/chatMemberHandler.service';
import { MyChatMemberHandlerService } from './telegram/myChatMemberHandler.service';
import { ChannelPostHandlerService } from './telegram/channelPostHandler.service';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly messageHandlerService: MessageHandlerService,
    private readonly reactionHandlerService: ReactionHandlerService,
    private readonly chatMemberHandlerService: ChatMemberHandlerService,
    private readonly myChatMemberHandlerService: MyChatMemberHandlerService,
    private readonly channelPostHandlerService: ChannelPostHandlerService,
  ) {}

  onModuleInit() {
    this.telegramService.registerMessageReactionHandler(this.reactionHandlerService);
    this.telegramService.registerMessageHandler(this.messageHandlerService);
    this.telegramService.registerChatMemberHandler(this.chatMemberHandlerService);
    this.telegramService.registerMyChatMemberHandler(this.myChatMemberHandlerService);
    this.telegramService.registerChannelPostHandler(this.channelPostHandlerService);
    this.telegramService.completeHandlerRegistration();
  }

  onModuleDestroy() {
    this.telegramService.destroyHandlerRegistration();
  }

  getHello(): string {
    return 'Hello World!';
  }
}
