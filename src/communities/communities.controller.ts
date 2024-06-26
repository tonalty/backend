import { Controller, Get, Headers, Logger, Param } from '@nestjs/common';
import { Community } from '../data/community.entity';
import { CommunitiesService } from './communities.service';
import { TmaService } from 'src/tma/tma.service';
import { CommunityUser } from 'src/data/communityUser.entity';

@Controller('communities')
export class CommunitiesController {
  private readonly logger = new Logger(CommunitiesController.name);

  constructor(private readonly tmaService: TmaService, private readonly communitiesService: CommunitiesService) {}

  @Get('user')
  getUserCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<CommunityUser>> {
    this.logger.log('getUserCommunities', JSON.stringify(tmaInitData));

    return this.communitiesService.getUserCommunities(this.tmaService.getUserId(tmaInitData));
  }

  @Get('admin')
  getAdminCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<CommunityUser>> {
    this.logger.log('getAdminCommunities', JSON.stringify(tmaInitData));

    return this.communitiesService.getAdminCommunities(this.tmaService.getUserId(tmaInitData));
  }

  @Get('all')
  getAllCommunities(@Headers('tmaInitData') tmaInitData: string) {
    this.logger.log('getAllCommunities', JSON.stringify(tmaInitData));

    try {
      const id = this.tmaService.getUserId(tmaInitData);

      return this.communitiesService.getAllCommunities(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get(':id')
  async getUserCommunity(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('id') id: number,
  ): Promise<CommunityUser | undefined> {
    const allCommunities = await this.getAllCommunities(tmaInitData);

    if (!allCommunities) {
      throw new Error('No communities');
    }

    const userCommunity = allCommunities.find((userCommunity) => userCommunity.chatId === id);

    if (!userCommunity) {
      throw new Error(`No such chat id ${id}`);
    }

    return userCommunity;
  }
}
