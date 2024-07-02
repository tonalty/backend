import { Controller, Get, Headers, Logger, NotFoundException, Param, Query } from '@nestjs/common';
import { TmaService } from 'src/tma/tma.service';
import { UserHistoryDto } from './UserHistoryDto';
import { HistoryService } from './history.service';
import { CommunityUserService } from 'src/communities/communityUser.service';

@Controller('history')
export class HistoryController {
  private readonly logger = new Logger(HistoryController.name);

  constructor(
    private readonly tmaService: TmaService,
    private readonly historyService: HistoryService,
    private readonly communityUserService: CommunityUserService,
  ) {}

  @Get('chat/:chatId')
  async getUserHistory(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('chatId') chatId: number,
    @Query('limit') limit: number,
  ): Promise<Array<UserHistoryDto>> {
    if (limit <= 0 || limit > 1000) {
      throw new Error('The limit should be in range [1, 1000]');
    }
    const userId = this.tmaService.getUserId(tmaInitData);
    const communityUser = await this.communityUserService.getCommunityUser(userId, chatId);
    if (!communityUser) {
      throw new NotFoundException('Unable to find user');
    }
    return this.historyService.getUserHistory(communityUser, limit);
  }
}
