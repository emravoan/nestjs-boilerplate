/**
 * Normalizes environment variables into structured runtime config.
 */
export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'NestJS Boilerplate',
    port: Number(process.env.PORT || 3000),
  },
  api: {
    key: process.env.API_KEY,
    prefix: process.env.API_PREFIX || 'api',
    version: process.env.API_VERSION || 'v1',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  csrf: {
    secret: process.env.CSRF_SECRET,
  },
  cors: {
    origins: process.env.CORS_ORIGINS || '',
  },
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL || 60000),
    limit: Number(process.env.THROTTLE_LIMIT || 60),
  },
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'nestjs_boilerplate',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || 'http://127.0.0.1:9000',
    accessKeyId: process.env.STORAGE_ACCESS_KEY || 'minio',
    secretAccessKey: process.env.STORAGE_SECRET_KEY || 'minio',
    fileBucket: process.env.STORAGE_FILE_BUCKET || 'files',
    imageBucket: process.env.STORAGE_IMAGE_BUCKET || 'images',
    videoBucket: process.env.STORAGE_VIDEO_BUCKET || 'videos',
  },
});
