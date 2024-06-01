import { Controller, Get, Post } from '@nestjs/common';
import { Message } from '../data/message.entity';
import { TelegramService } from './telegram.service';

@Controller('user')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Get()
  getAllMessages(): Promise<Array<Message>> {
    return this.telegramService.getAllMessages();
  }
}
