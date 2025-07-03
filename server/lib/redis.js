// redisClient.js
const IORedis = require("ioredis");

const connection = new IORedis({
  username: process.env.REDIS_USERNAME,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

module.exports = connection;
