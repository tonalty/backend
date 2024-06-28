import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  STAGE: Joi.string().required(),
  PORT: Joi.number().default(3000).required(),
  DB_URL: Joi.string().required(),
  BOT_TOKEN: Joi.string().required(),
  AUTH_DATE_SEC_TIMEOUT: Joi.number().default(1800).required(),
  MNEMONIC: Joi.string().required(),
  WEB_APP_NAME: Joi.string().required(),
  BOT_NAME: Joi.string().required(),
  SERVER_ORIGIN: Joi.string().required(),
});
