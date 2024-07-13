import { Body, Controller, Get, Headers, Logger, NotFoundException, Param, Patch } from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegram.service';
import { TmaService } from 'src/tma/tma.service';
import { CommunityService } from './community.service';
import { CommunityUserService } from './communityUser.service';
import { CommunityDto } from './dto/CommunityDto';
import { CommunityUserDto } from './dto/CommunityUserDto';
import { CommunityUserWithChatPhotoLinkDto } from './dto/CommunityUserWithChatPhotoLinkDto';
import { IUpdateSettingsDto } from './dto/UpdateSettingsDto';

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
  getAdminCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<CommunityUserWithChatPhotoLinkDto>> {
    this.logger.log('getAdminCommunities', JSON.stringify(tmaInitData));

    return this.communityUserService.getAdminCommunities(this.tmaService.getUserId(tmaInitData));
  }

  @Get('user')
  getAllCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<CommunityUserWithChatPhotoLinkDto>> {
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

  @Patch('settings')
  updateTriggers(
    @Headers('tmaInitData') tmaInitData: string,
    @Body() UpdateSettingsDto: IUpdateSettingsDto,
  ): Promise<boolean> {
    this.logger.log('UpdateSettingsDto', UpdateSettingsDto);

    try {
      this.tmaService.getUserId(tmaInitData);
    } catch (error) {
      throw new Error(error);
    }

    return this.communitiesService.updateSettings(UpdateSettingsDto);
  }
}
