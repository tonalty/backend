import { Body, Controller, Get, Param, Patch, Headers, Logger } from '@nestjs/common';
import { TriggersService } from './triggers.service';
import { TmaService } from 'src/tma/tma.service';
import { Triggers } from 'src/data/community.entity';
import { TriggersDto } from './dto/triggersDto';

@Controller('triggers')
export class TriggersController {
  private readonly logger = new Logger(TmaService.name);

  constructor(private readonly tmaService: TmaService, private readonly triggersService: TriggersService) {}

  @Get('community/:chatId')
  getTriggersByCommunity(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('chatId') chatId: number,
  ): Promise<Triggers> {
    try {
      this.tmaService.getUserId(tmaInitData);
    } catch (error) {
      this.logger.error(error);
    }

    return this.triggersService.getTriggersByCommunity(chatId);
  }

  @Patch('community')
  updateTriggers(@Headers('tmaInitData') tmaInitData: string, @Body() triggersDto: TriggersDto): Promise<boolean> {
    this.logger.log('triggersDto', triggersDto);

    try {
      this.tmaService.getUserId(tmaInitData);
    } catch (error) {
      throw new Error(error);
    }

    return this.triggersService.updateTriggers(triggersDto);
  }
}
