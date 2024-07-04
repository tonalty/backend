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

  @Get('/botInfo/')
  getBotName(): BotInfo {
    return this.telegramService.getBotInfo();
  }

  @Get('/botInfo/:chatId')
  getBotStatus(@Param('chatId') chatId: number): Promise<{ isAdmin: boolean }> {
    return this.telegramService.getBotStatus(chatId);
  }
}
