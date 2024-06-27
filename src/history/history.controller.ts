import { Controller, Get, Headers, Logger, Param, Query } from '@nestjs/common';
import { TmaService } from 'src/tma/tma.service';
import { UserHistoryDto } from './UserHistoryDto';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  private readonly logger = new Logger(HistoryController.name);

  constructor(private readonly tmaService: TmaService, private readonly historyService: HistoryService) {}

  @Get('chat/:chatId')
  getUserHistory(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('chatId') chatId: number,
    @Query('limit') limit: number,
  ): Promise<Array<UserHistoryDto>> {
    if (limit <= 0 || limit > 1000) {
      throw new Error('The limit should be in range [1, 1000]');
    }
    const userId = this.tmaService.getUserId(tmaInitData);
    return this.historyService.getUserHistory(userId, chatId, limit);
  }
}
