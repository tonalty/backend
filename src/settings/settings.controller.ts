import { Body, Controller, Get, Param, Patch, Headers, Logger } from '@nestjs/common';
import { TmaService } from 'src/tma/tma.service';
import { SettingsService } from './settings.service';
import { Settings } from 'src/data/community.entity';
import { UpdateSettingsDto } from './dto/UpdateSettingsDto';

@Controller('settings')
export class SettingsControler {
  private readonly logger = new Logger(SettingsControler.name);

  constructor(private readonly tmaService: TmaService, private readonly settingsService: SettingsService) {}

  @Get('community/:chatId')
  getSettingssByCommunity(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('chatId') chatId: number,
  ): Promise<Settings> {
    try {
      this.tmaService.getUserId(tmaInitData);
    } catch (error) {
      this.logger.error(error);
    }

    return this.settingsService.getSettingsByCommunity(chatId);
  }

  @Patch('community')
  updateTriggers(
    @Headers('tmaInitData') tmaInitData: string,
    @Body() UpdateSettingsDto: UpdateSettingsDto,
  ): Promise<boolean> {
    this.logger.log('UpdateSettingsDto', UpdateSettingsDto);

    try {
      this.tmaService.getUserId(tmaInitData);
    } catch (error) {
      throw new Error(error);
    }

    return this.settingsService.updateSettings(UpdateSettingsDto);
  }
}
