import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TmaService {
  private readonly logger = new Logger(TmaService.name);

  constructor(configService: ConfigService) {
    this.secretKey = crypto.createHmac('sha256', 'WebAppData').update(configService.getOrThrow('BOT_TOKEN')).digest();
    this.authDateTimeout = 1000 * Number(configService.getOrThrow('AUTH_DATE_SEC_TIMEOUT'));
  }

  private readonly secretKey: Buffer;
  private readonly authDateTimeout: number;

  public parseWebAppInitData(tmaInitData: string): WebAppInitData {
    const urlSearchParams = new URLSearchParams(tmaInitData);
    const hash = urlSearchParams.get('hash');
    if (!hash) {
      throw new UnauthorizedException('webAppInitData has not hash param');
    }
    urlSearchParams.delete('hash');

    const entries = [...urlSearchParams.entries()];
    entries.sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));
    const entriesString = entries.map((e) => e[0] + '=' + e[1]).join('\n');

    const calculatedHash = crypto.createHmac('sha256', this.secretKey).update(entriesString).digest('hex');
    if (hash !== calculatedHash) {
      throw new UnauthorizedException('webAppInitData hash param was failed to verify');
    }

    const auth_date = 1000 * Number(urlSearchParams.get('auth_date'));
    if (!auth_date) {
      throw new UnauthorizedException('webAppInitData auth_date param is wrong');
    }
    if (auth_date > Date.now()) {
      throw new UnauthorizedException('webAppInitData auth_date param is in future');
    }
    if (auth_date + this.authDateTimeout < Date.now()) {
      throw new UnauthorizedException('webAppInitData auth_date param is too old');
    }
    urlSearchParams.delete('auth_date');

    const webAppInitData: WebAppInitData & Record<string, unknown> = { auth_date, hash };
    for (const [key, value] of urlSearchParams.entries()) {
      const firstChar = value.substring(0, 1);
      const lastChar = value.substring(value.length - 1);
      webAppInitData[key] =
        (firstChar === '{' && lastChar == '}') || (firstChar === '[' && lastChar === ']') ? JSON.parse(value) : value;
    }
    return webAppInitData;
  }

  getUserId(tmaInitData: string) {
    this.logger.log('tmaInitData', tmaInitData);

    // const webAppInitData: WebAppInitData = { auth_date: 0, hash: '', user: { id: 307294448, first_name: 'dummy' } };
    const webAppInitData = this.parseWebAppInitData(tmaInitData);

    if (!webAppInitData.user) {
      throw new UnauthorizedException('webAppInitData has no user');
    }

    this.logger.log('webAppInitData', webAppInitData);

    return webAppInitData.user.id;
  }

  // duplication
  getUserInfo(tmaInitData: string): WebAppUser {
    // const webAppInitData = this.parseWebAppInitData(tmaInitData);

    // const webAppInitData: WebAppInitData = {
    //   auth_date: 0,
    //   hash: '',
    //   user: { id: 147388258, first_name: 'super' },
    // };
    const webAppInitData = this.parseWebAppInitData(tmaInitData);

    if (!webAppInitData.user) {
      throw new UnauthorizedException('webAppInitData has no user');
    }

    return webAppInitData.user;
  }

  validateInitData(tmaInitData: string) {
    this.getUserId(tmaInitData);
  }
}
