import { validationConfig } from 'src/config/validation.config';
import { SwaggerConfig } from 'src/config/swagger.config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';
import { exit } from 'process';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);
  const config: ConfigService = app.get<ConfigService>(ConfigService);

  // CORS 설정
  app.enableCors({
    origin: true, // 개발 환경에서는 모든 origin 허용
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const swaggerPath: string = config.get<string>('SWAGGER_PATH')!;
  const port: number = config.get<number>('PORT')!;
  const document: OpenAPIObject = SwaggerModule.createDocument(
    app,
    SwaggerConfig,
  );

  app.useGlobalPipes(new ValidationPipe(validationConfig));

  SwaggerModule.setup(swaggerPath, app, document);

  app.enableShutdownHooks();

  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  exit(1);
});
