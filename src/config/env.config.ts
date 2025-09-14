import { ConfigModuleOptions } from '@nestjs/config';
import Joi from 'joi';

const validationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  SERVER_PORT: Joi.number().default(3000),
  SWAGGER_PATH: Joi.string().default('api'),
  STOCK_API_KEY: Joi.string().required(),
})
  .unknown()
  .required();

export const envConfig: ConfigModuleOptions = {
  isGlobal: true,
  validationSchema,
  expandVariables: true,
};
