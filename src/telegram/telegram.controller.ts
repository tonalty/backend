import { Controller, Get, Param } from '@nestjs/common';
import { TelegramService } from './telegram.service';

interface BotInfo {
  firstName?: string;
  lastName?: string;
  userName: string;
}

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('/chat/:chatId')
  getChat(@Param('chatId') chatId: number) {
    return this.telegramService.getChat(chatId);
  }

  @Get('/botInfo')
  getBotName(): BotInfo {
    return this.telegramService.getBotInfo();
  }
}
