import { Logger, NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as morgan from 'morgan';
import { AppModule, PUBLIC_FS_IMAGE_DIRECTORY } from './app.module';
import { PUBLIC_FS_DIRECTORY } from './app.module';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  createPublicDirectories();
  const logger = new Logger();

  const options: NestApplicationOptions = {
    cors: true,
  };
  if (process.env.STAGE === 'dev') {
    options.httpsOptions = {
      key: fs.readFileSync('../localhost.direct.key'),
      cert: fs.readFileSync('../localhost.direct.crt'),
    };
  }

  const app = await NestFactory.create(AppModule, options);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  app.setGlobalPrefix('backend');
  const config = new DocumentBuilder().setTitle('Tonalty API').setVersion('1.0').build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(app.get(ConfigService).getOrThrow('PORT'));
  //Configure logger
  app.use(morgan('tiny'));
  await app.listen(port);

  logger.log(`Public fs path: ${PUBLIC_FS_DIRECTORY}`);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();

function createPublicDirectories() {
  if (!existsSync(PUBLIC_FS_DIRECTORY)) {
    mkdirSync(PUBLIC_FS_DIRECTORY);
  }
  if (!existsSync(PUBLIC_FS_IMAGE_DIRECTORY)) {
    mkdirSync(PUBLIC_FS_IMAGE_DIRECTORY);
  }
}
