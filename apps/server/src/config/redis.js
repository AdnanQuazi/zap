
const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

// Listen for connection errors
redis.on("error", (err) => {
  console.error("Redis error:", err);
});

// Optionally log when connected
redis.on("connect", () => {
  console.log("Connected to Redis successfully!");
});

module.exports = redis;
