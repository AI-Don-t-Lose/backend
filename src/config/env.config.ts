import { ConfigModuleOptions } from '@nestjs/config';
import { number, object, string } from 'joi';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access  */
const validationSchema = object({
  DATABASE_URL: string().required(),
  SERVER_PORT: number().default(3000),
  SWAGGER_PATH: string().default('api'),
})
  .unknown()
  .required();

export const envConfig: ConfigModuleOptions = {
  isGlobal: true,
  validationSchema,
  expandVariables: true,
};
