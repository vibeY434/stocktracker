import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stockRoutes from './routes/stock.js';
import searchRoutes from './routes/search.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', stockRoutes);
app.use('/api', searchRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/search?q={query}`);
  console.log(`  GET /api/quote?symbol={symbol}`);
  console.log(`  GET /api/company?symbol={symbol}`);
  console.log(`  GET /api/fundamentals?symbol={symbol}`);
  console.log(`  GET /api/historical?symbol={symbol}&range={range}`);
});
