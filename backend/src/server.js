const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const packageRoutes = require('./routes/packageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seedAdmin = require('./utils/seedAdmin');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;
const blogRoutes = require('./routes/blogRoutes');

// CORS configuration for frontend
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:5173', // Vite standard port
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Not allowed by origin'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  })
);

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Health check root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Ovizatri Travel & Tourism Backend API',
    version: '1.0.0',
    documentation: {
      auth: {
        travelerSignup: 'POST /api/auth/signup/traveler',
        agencySignup: 'POST /api/auth/signup/agency',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
      },
      packages: {
        listAll: 'GET /api/packages',
        getOne: 'GET /api/packages/:id',
        create: 'POST /api/packages (Agency/Admin)',
        agencyPackages: 'GET /api/packages/agency/my-packages',
      },
      admin: {
        stats: 'GET /api/admin/stats (Admin only)',
        users: 'GET /api/admin/users (Admin only)',
        verifyAgency: 'PATCH /api/admin/agencies/:agencyUserId/verify',
      },
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blogs', blogRoutes);
// Global 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found on this server.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start Server and ensure Admin Seeding
app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 Ovizatri Backend is running on port ${PORT}`);
  console.log(`🌐 Base API URL: http://localhost:${PORT}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);

  try {
    await seedAdmin();
  } catch (err) {
    console.warn('Note: Could not automatically seed admin upon boot (ensure DB is running):', err.message);
  }
});
