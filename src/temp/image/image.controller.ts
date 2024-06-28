import {
  Controller,
  Headers,
  HttpStatus,
  Logger,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { TmaService } from 'src/tma/tma.service';
import { CreateTempImageDto } from './dto/CreateTempImageDto';
import { TempImageService } from './image.service';

const MAX_IMAGE_SIZE_IN_BYTES = 10 * 1024 * 1024;

@Controller('image')
export class TempImageController {
  private readonly logger = new Logger(TempImageController.name);

  constructor(private readonly tmaService: TmaService, private readonly tempImageService: TempImageService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of cats',
    type: CreateTempImageDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  createImage(
    @Headers('tmaInitData') tmaInitData: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE_IN_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    data: Express.Multer.File,
  ) {
    this.tmaService.validateInitData(tmaInitData);
    return this.tempImageService.createTempImage(data.mimetype, data.buffer);
  }
}
