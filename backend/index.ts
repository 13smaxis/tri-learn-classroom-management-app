
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import teacherRoutes from './routes/teacher.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(corsMiddleware); // CORS
app.use(express.json()); // JSON parser
app.use(express.urlencoded({ extended: true })); // URL-encoded parser

// Log all requests
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { headers: req.headers.authorization ? '***' : 'none' });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    app: 'Tri-Learn Backend',
    version: '1.0.0',
    status: 'running',
    docs: 'See README.md for API documentation',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: 'Server error',
    message,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📚 API: http://localhost:${PORT}/api`);
  logger.info(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  logger.info(`👨‍🏫 Teacher: http://localhost:${PORT}/api/teacher`);
});

export default app;
