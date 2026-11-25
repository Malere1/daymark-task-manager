import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use('/api/tasks', taskRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.status ? err.message : 'Something went wrong on the server.'
  });
});

const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Create server/.env from server/.env.example.');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/daymark')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`Daymark API running at http://localhost:${port}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });