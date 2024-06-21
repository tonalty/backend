import { Controller, Get, Headers, Logger, Param } from '@nestjs/common';
import { Community } from '../data/community.entity';
import { CommunitiesService } from './communities.service';
import { TmaService } from 'src/tma/tma.service';
import { UserCommunity } from './interfaces/UserCommunity';

@Controller('communities')
export class CommunitiesController {
  private readonly logger = new Logger(CommunitiesController.name);

  constructor(private readonly tmaService: TmaService, private readonly communitiesService: CommunitiesService) {}

  @Get('user')
  getUserCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<UserCommunity>> {
    this.logger.log('getUserCommunities', JSON.stringify(tmaInitData));

    return this.communitiesService.getUserCommunities(this.tmaService.getUserId(tmaInitData));
  }

  @Get('admin')
  getAdminCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<Community>> {
    this.logger.log('getAdminCommunities', JSON.stringify(tmaInitData));

    return this.communitiesService.getAdminCommunities(this.tmaService.getUserId(tmaInitData));
  }

  @Get(':id')
  async getUserCommunity(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('id') id: number,
  ): Promise<UserCommunity | undefined> {
    const allCommunities = await this.getUserCommunities(tmaInitData);

    const userCommunity = allCommunities.find((userCommunity) => userCommunity.community.chatId === id);

    if (!userCommunity) {
      throw new Error(`No such chat id ${id}`);
    }

    console.log('userCommunity', userCommunity);
    return userCommunity;
  }
}
