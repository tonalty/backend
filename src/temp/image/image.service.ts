import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { writeFileSync } from 'fs';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { PUBLIC_FS_IMAGE_DIRECTORY, PUBLIC_IMAGE_ENDPOINT } from 'src/app.module';
import { EXPIRE_AFTER_SECONDS, TempImage } from 'src/data/tempImage.entity';
import { CreatedTempImageDto } from './dto/CreatedTempImageDto';

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

  async createTempImage(mimetype: string, image: Buffer): Promise<CreatedTempImageDto> {
    const mathResult = mimetype.match(/image\/([a-z]+)/);
    if (!mathResult) {
      throw new BadRequestException('Unrecognized image mimetype');
    }
    const fileExtension = mathResult[1];
    this.logger.log(`Creating temp image with extension ${fileExtension}`);
    const response = await this.tempImageModel.create({ extension: fileExtension, data: image });
    const expiresAt = new Date(response.createdAt.getTime() + EXPIRE_AFTER_SECONDS * 1000);
    return { id: response._id.toHexString(), expiresAt: expiresAt };
  }

  async saveImageToPermanent(imageId: string, imageName: string): Promise<string> {
    const tempImage = await this.tempImageModel.findOne({ _id: new Types.ObjectId(imageId) });
    if (!tempImage) {
      throw new Error(`Unable to find image by id ${imageId}`);
    }
    const imageFilename = `${imageName}.${tempImage.extension}`;
    this.logger.log(`Found temp image by id ${imageId}. Saving image ${imageFilename}`);
    writeFileSync(join(PUBLIC_FS_IMAGE_DIRECTORY, imageFilename), tempImage.data);
    return join(this.serverOrigin, PUBLIC_IMAGE_ENDPOINT, imageFilename);
  }
}
