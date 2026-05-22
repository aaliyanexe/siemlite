const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const incidentRoutes = require('./modules/incidents/incidents.routes');
const threatTypeRoutes = require('./modules/threat-types/threat-types.routes');
const assetRoutes = require('./modules/assets/assets.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const logRoutes = require('./modules/logs/logs.routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(apiLimiter);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'SIEMlite API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/threat-types', threatTypeRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/logs', logRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
