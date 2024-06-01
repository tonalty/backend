import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key: fs.readFileSync('../localhost.direct.key'),
      cert: fs.readFileSync('../localhost.direct.crt'),
    },
    cors: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );
  const port = Number(app.get(ConfigService).getOrThrow('PORT'));

  await app.listen(port);

  logger.log(`Application listening on port ${port}`);
}
bootstrap();
