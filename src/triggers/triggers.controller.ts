import { Body, Controller, Get, Param, Patch, Headers, Logger } from '@nestjs/common';
import { TriggersService } from './triggers.service';
import { TmaService } from 'src/tma/tma.service';
import { Triggers } from 'src/data/community.entity';
import { UpdateTriggersDto } from './dto/UpdateTriggersDto';

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
  updateTriggers(
    @Headers('tmaInitData') tmaInitData: string,
    @Body() updateTriggersDto: UpdateTriggersDto,
  ): Promise<boolean> {
    this.logger.log('updateTriggersDto', updateTriggersDto);

    try {
      this.tmaService.getUserId(tmaInitData);
    } catch (error) {
      throw new Error(error);
    }

    return this.triggersService.updateTriggers(updateTriggersDto);
  }
}
