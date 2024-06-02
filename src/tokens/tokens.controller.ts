import { Body, Controller, Get, Headers, Logger, Param, Post } from '@nestjs/common';
import { TmaService } from 'src/tma/tma.service';
import { MintTokensDto } from './dto/MintTokensDto';
import { TokensService } from './tokens.service';
import { ClaimTokensDto } from './dto/ClaimTokensDto';

@Controller('tokens')
export class TokensController {
  private readonly logger = new Logger(TokensController.name);

  constructor(private readonly tmaService: TmaService, private readonly tokensService: TokensService) {}

  @Get('metadata/:chatId')
  getMetadata(@Param('chatId') chatId: number): Promise<any> {
    return this.tokensService.getMetadata(chatId);
  }

  @Post('mintTokens')
  mintTokens(@Headers('tmaInitData') tmaInitData: string, @Body() mintTokensDto: MintTokensDto): Promise<any> {
    this.tmaService.getUserId(tmaInitData);
    return this.tokensService.mintTokens(mintTokensDto);
  }

  @Post('claimTokens')
  claimTokens(@Headers('tmaInitData') tmaInitData: string, @Body() claimTokensDto: ClaimTokensDto): Promise<any> {
    return this.tokensService.claimTokens(this.tmaService.getUserId(tmaInitData), claimTokensDto);
  }
}
