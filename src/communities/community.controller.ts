import { Controller, Get, Headers, Logger, NotFoundException, Param } from '@nestjs/common';
import { CommunityService } from './community.service';
import { TmaService } from 'src/tma/tma.service';
import { CommunityUser } from 'src/data/communityUser.entity';
import { CommunityUserService } from './communityUser.service';
import { CommunityDto } from './dto/CommunityDto';
import { TelegramService } from 'src/telegram/telegram.service';
import { CommunityUserDto } from './dto/CommunityUserDto';

@Controller('community')
export class CommunityController {
  private readonly logger = new Logger(CommunityController.name);

  constructor(
    private readonly tmaService: TmaService,
    private readonly communitiesService: CommunityService,
    private readonly communityUserService: CommunityUserService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get('admin-user')
  getAdminCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<CommunityUser>> {
    this.logger.log('getAdminCommunities', JSON.stringify(tmaInitData));

    return this.communityUserService.getAdminCommunities(this.tmaService.getUserId(tmaInitData));
  }

  @Get('user')
  getAllCommunities(@Headers('tmaInitData') tmaInitData: string) {
    this.logger.log('getAllCommunities', JSON.stringify(tmaInitData));

    try {
      const id = this.tmaService.getUserId(tmaInitData);

      return this.communityUserService.getAllCommunities(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get(':chatId/user')
  async getUserCommunity(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('chatId') chatId: number,
  ): Promise<CommunityUserDto> {
    const userId = this.tmaService.getUserId(tmaInitData);
    this.logger.log(`userId = ${userId}, chatId = ${chatId}`);
    const chatMember = await this.telegramService.getChatMember(userId, chatId);
    if (!chatMember) {
      throw new NotFoundException('Not found user in community');
    }
    const isAdmin = this.communityUserService.isChatMemberAdmin(chatMember);
    return this.communityUserService.createOrUpdateCommunityUser(userId, chatId, isAdmin);
  }

  @Get(':chatId')
  async getCommunity(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('chatId') chatId: number,
  ): Promise<CommunityDto> {
    const userId = this.tmaService.getUserId(tmaInitData);
    this.communityUserService.validateCommunityUserPresent(userId, chatId);
    return this.communitiesService.getCommunity(chatId);
  }
}
