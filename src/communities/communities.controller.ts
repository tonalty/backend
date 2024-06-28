import { Controller, Get, Headers, Logger, Param } from '@nestjs/common';
import { CommunityService } from './communities.service';
import { TmaService } from 'src/tma/tma.service';
import { CommunityUser } from 'src/data/communityUser.entity';
import { CommunityUserService } from './communityUser.service';

@Controller('communities')
export class CommunitiesController {
  private readonly logger = new Logger(CommunitiesController.name);

  constructor(
    private readonly tmaService: TmaService,
    private readonly communitiesService: CommunityService,
    private readonly communityUserService: CommunityUserService,
  ) {}

  @Get('admin')
  getAdminCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<CommunityUser>> {
    this.logger.log('getAdminCommunities', JSON.stringify(tmaInitData));

    return this.communityUserService.getAdminCommunities(this.tmaService.getUserId(tmaInitData));
  }

  @Get('all')
  getAllCommunities(@Headers('tmaInitData') tmaInitData: string) {
    this.logger.log('getAllCommunities', JSON.stringify(tmaInitData));

    try {
      const id = this.tmaService.getUserId(tmaInitData);

      return this.communityUserService.getAllCommunities(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get(':chatId')
  async getUserCommunity(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('chatId') chatId: number,
  ): Promise<CommunityUser | undefined> {
    const allCommunities = await this.getAllCommunities(tmaInitData);

    if (!allCommunities) {
      throw new Error('No communities');
    }

    const userCommunity = allCommunities.find((userCommunity) => userCommunity.chatId === chatId);

    if (!userCommunity) {
      throw new Error(`No such chat id ${chatId}`);
    }

    return userCommunity;
  }
}
