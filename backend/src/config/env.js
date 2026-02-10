const dotenv = require('dotenv');
const Joi = require('joi');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = Joi.object({
    PORT: Joi.number().default(8080),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),

    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),

    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

    CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
}).unknown().required();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    db: {
        host: envVars.DB_HOST,
        port: envVars.DB_PORT,
        user: envVars.DB_USER,
        password: envVars.DB_PASSWORD,
        name: envVars.DB_NAME,
    },
    redis: {
        host: envVars.REDIS_HOST,
        port: envVars.REDIS_PORT,
    },
    jwt: {
        accessSecret: envVars.JWT_ACCESS_SECRET,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
        accessExpiry: envVars.JWT_ACCESS_EXPIRY,
        refreshExpiry: envVars.JWT_REFRESH_EXPIRY,
    },
    cors: {
        origin: envVars.CORS_ORIGIN,
    },
};
