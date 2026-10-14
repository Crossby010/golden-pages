import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { testDbConnection } from './config/database.js';
import { testRedisConnection } from './config/redis.js';
import { testCloudinaryConnection } from './config/cloudinary.js';
import { errorHandler } from './middleware/error-handler.js';

// Routes
import authRoutes from './routes/auth-routes.js';
import bookRoutes from './routes/book-routes.js';
import orderRoutes from './routes/order-routes.js';
import reviewRoutes from './routes/review-routes.js';
import userRoutes from './routes/user-routes.js';

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: env.IS_PROD ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGIN.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan(env.IS_PROD ? 'combined' : 'dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Golden Pages API is running',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

// ============================================
// 404
// ============================================
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler);

// ============================================
// START
// ============================================
async function start() {
  try {
    await testDbConnection();
    await testRedisConnection();
    await testCloudinaryConnection();

    app.listen(env.PORT, () => {
      console.log(`\n🚀 Golden Pages API running on http://localhost:${env.PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   CORS: ${env.CORS_ORIGIN.join(', ')}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});

start();