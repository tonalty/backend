import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  STAGE: Joi.string().required(),
  PORT: Joi.number().default(3000).required(),
  DB_URL: Joi.string().required(),
  BOT_TOKEN: Joi.string().required(),
  THRESHOLD_FOR_POINTS: Joi.number().default(1).required(),
  AUTH_DATE_SEC_TIMEOUT: Joi.number().default(1800).required(),
});
