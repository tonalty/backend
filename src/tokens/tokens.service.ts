import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(configService: ConfigService) {
    //this.authDateTimeout = 1000 * Number(configService.getOrThrow('AUTH_DATE_SEC_TIMEOUT'));
  }
}
