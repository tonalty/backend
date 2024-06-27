import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EXPIRE_AFTER_SECONDS, TempImage } from 'src/data/tempImage.entity';
import { CreatedTempImageDto } from './dto/CreatedTempImageDto';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { PUBLIC_ENDPOINT, PUBLIC_FS_DIRECTORY } from 'src/app.module';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TempImageService {
  private readonly logger = new Logger(TempImageService.name);
  private readonly serverOrigin;

  constructor(
    @InjectModel(TempImage.name) private readonly tempImageModel: Model<TempImage>,
    configService: ConfigService,
  ) {
    this.serverOrigin = configService.getOrThrow('SERVER_ORIGIN');
  }

  async createTempImage(image: Buffer): Promise<CreatedTempImageDto> {
    const response = await this.tempImageModel.create({ data: image });
    const expiresAt = new Date(response.createdAt.getTime() + EXPIRE_AFTER_SECONDS * 1000);
    return { id: response._id.toHexString(), expiresAt: expiresAt };
  }

  async saveImageToPermanent(imageId: string, imageName: string): Promise<string> {
    const tempImage = await this.tempImageModel.findOne({ _id: new Types.ObjectId(imageId) });
    if (!tempImage) {
      throw new Error(`Unable to find image by id ${imageId}`);
    }
    this.logger.log(`Found temp image by id ${imageId}`);
    writeFileSync(join(PUBLIC_FS_DIRECTORY, imageName), tempImage.data);
    return join(this.serverOrigin, PUBLIC_ENDPOINT, imageName);
  }
}
