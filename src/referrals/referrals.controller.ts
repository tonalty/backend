import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { TmaService } from 'src/tma/tma.service';
import { ReferralsService } from './referrals.service';
import { ReferralJoinDto } from './dto/referralJoinDto';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly tmaService: TmaService, private readonly referralsService: ReferralsService) {}

  @ApiBody({
    schema: {
      properties: {
        chatId: { type: 'number' },
        title: { type: 'string' },
      },
    },
  })
  @Post()
  generateReferral(
    @Headers('tmaInitData') tmaInitData: string,
    @Body() body: { chatId: number; title: string },
  ): Promise<string> {
    const userInfo = this.getUserInfo(tmaInitData);

    const name = String(userInfo.username || userInfo.first_name || userInfo.last_name || userInfo.id);

    return this.referralsService.generateReferral(userInfo.id, body.chatId, body.title, name);
  }

  @Get('currentUser')
  getUserInfo(@Headers('tmaInitData') tmaInitData: string) {
    return this.tmaService.getUserInfo(tmaInitData);
  }

  @Get('startParam')
  getStartParam(@Headers('startParam') startParam: string) {
    return this.referralsService.decodeStartParam(startParam);
  }

  @ApiBody({
    schema: {
      properties: {
        chatId: { type: 'number' },
        ownerId: { type: 'number' },
        title: { type: 'string' },
      },
    },
  })
  @Post('join')
  joinUserByReferralLink(@Headers('tmaInitData') tmaInitData: string, @Body() body: ReferralJoinDto): Promise<void> {
    const userInfo = this.tmaService.getUserInfo(tmaInitData);

    return this.referralsService.joinUserByReferralLink(userInfo, body.chatId, body.ownerId, body.title);
  }
}
