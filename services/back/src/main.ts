import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('ZKorum')
    .setDescription('ZKorum API')
    .setVersion('1.0')
    .addTag('zkorum')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  if (process.env.NODE_ENV === 'development') {
    fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  }
  SwaggerModule.setup('api', app, document);

  if (process.env.ONLY_SWAGGER !== 'true') {
    await app.listen(3000);
  }
}
bootstrap();
