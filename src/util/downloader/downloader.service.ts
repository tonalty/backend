import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { writeFile } from 'fs/promises';
import { URL } from 'url';

@Injectable()
export class DownloaderService {
  private readonly logger = new Logger(DownloaderService.name);

  constructor(private readonly httpService: HttpService) {}

  async downloadFileTo(downloadLink: URL, downloadPath: string): Promise<boolean> {
    try {
      const response = await this.httpService.axiosRef.get(downloadLink.toString(), { responseType: 'stream' });
      await writeFile(downloadPath, response.data);
      return true;
    } catch (error) {
      this.logger.log(`Error during downloading image. URL: ${downloadLink}. Path: ${downloadPath}`, error);
    }
    return false;
  }
}
