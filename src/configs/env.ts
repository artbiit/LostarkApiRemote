import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENV_FILE || '.env' });

const requiredEnv = {
  DB: ['HOST', 'PORT', 'USER', 'PASSWORD', 'NAME', 'CONNECTION_LIMIT'],
  SERVER: ['PORT', 'BIND'],
  REDIS: ['HOST', 'PORT', 'PASSWORD'],
  LOGGER: ['STACK_TRACE'],
};

// 플랫한 config 생성
const configs: Record<string, string | number> = {};

Object.entries(requiredEnv).forEach(([namespace, keys]) => {
  keys.forEach((key) => {
    const fullKey = `${namespace}_${key}`;
    if (!process.env[fullKey]) {
      throw new Error(`Missing required environment variable: ${fullKey}`);
    }
    configs[fullKey] = isNaN(Number(process.env[fullKey]))
      ? process.env[fullKey]!
      : Number(process.env[fullKey]);
  });
});

export default configs;
