import { Body, Controller, Headers, Logger, Post } from '@nestjs/common';
import { TmaService } from 'src/tma/tma.service';
import { MintTokensDto } from './dto/MintTokensDto';
import { TokensService } from './tokens.service';
import { ClaimTokensDto } from './dto/ClaimTokensDto';

@Controller('tokens')
export class TokensController {
  private readonly logger = new Logger(TokensController.name);

  constructor(private readonly tmaService: TmaService, private readonly tokensService: TokensService) {}

  @Post('mintTokens')
  mintTokens(@Headers('tmaInitData') tmaInitData: string, @Body() mintTokensDto: MintTokensDto): Promise<any> {
    this.tmaService.getUserId(tmaInitData);
    //return this.tokensService.mintTokens(mintTokensDto);
    return Promise.resolve();
  }

  @Post('claimTokens')
  claimTokens(@Headers('tmaInitData') tmaInitData: string, @Body() claimTokensDto: ClaimTokensDto): Promise<any> {
    this.logger.log('tmaInitData', tmaInitData);
    this.logger.log('claimTokensDto', claimTokensDto);

    //return this.tokensService.claimTokens(this.tmaService.getUserId(tmaInitData), claimTokensDto);
    return Promise.resolve();
  }
}
