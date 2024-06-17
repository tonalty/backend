import { TmaService } from 'src/tma/tma.service';
import { ReferralsService, TgWebAppStartParam } from './referrals.service';
import { Body, Controller, Get, Headers, Post } from '@nestjs/common';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly tmaService: TmaService, private readonly referralsService: ReferralsService) {}

  @Post()
  generateReferral(@Headers('tmaInitData') tmaInitData: string, @Body() body: { chatId: number }): Promise<string> {
    return this.referralsService.generateReferral(this.tmaService.getUserId(tmaInitData), body.chatId);
  }

  @Post('tgWebAppStartParam')
  tgWebAppStartParam(@Body() payload: TgWebAppStartParam) {
    return this.referralsService.tgWebAppStartParam(payload);
  }
}
