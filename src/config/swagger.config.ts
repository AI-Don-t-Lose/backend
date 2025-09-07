import { DocumentBuilder } from '@nestjs/swagger';

export const SwaggerConfig = new DocumentBuilder()
  .setTitle('AIDL API')
  .setDescription('AIDL API description')
  .setVersion('0.0.1')
  .build();
