import { Logger, NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
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

  const config = new DocumentBuilder().setTitle('Tonalty API').setVersion('1.0').build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(app.get(ConfigService).getOrThrow('PORT'));
  await app.listen(port);

  logger.log(`Application listening on port ${port}`);
}
bootstrap();
