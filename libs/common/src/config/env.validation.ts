import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  // Each service provides its own DATABASE_URL — validated per-service, not here.
}).unknown(true); // allow AUTH_DATABASE_URL, CATALOG_DATABASE_URL, TCP ports, etc.
