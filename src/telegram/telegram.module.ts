import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [],
  providers: [TelegramService],
  controllers: [TelegramController],
})
export class TelegramModule {}
