import { Body, Controller, Get, Param, Patch, Headers } from '@nestjs/common';
import { TriggersService } from './triggers.service';
import { TmaService } from 'src/tma/tma.service';
import { Community } from 'src/data/community.entity';
import { TriggersDto } from './dto/triggersDto';

@Controller('triggers')
export class TriggersController {
  constructor(private readonly tmaService: TmaService, private readonly triggersService: TriggersService) {}

  @Get('community/:chatId')
  getTriggersByCommunity(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('chatId') chatId: number,
  ): Promise<Community> {
    try {
      this.tmaService.getUserId(tmaInitData);
    } catch (error) {
      throw new Error(error);
    }

    return this.triggersService.getTriggersByCommunity(chatId);
  }

  @Patch('community')
  updateTriggers(@Headers('tmaInitData') tmaInitData: string, @Body() triggersDto: TriggersDto): Promise<boolean> {
    try {
      this.tmaService.getUserId(tmaInitData);
    } catch (error) {
      throw new Error(error);
    }

    return this.triggersService.updateTriggers(triggersDto);
  }
}
