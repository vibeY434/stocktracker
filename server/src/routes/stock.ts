import { Router, type Request, type Response } from 'express';
import { yahooFinance } from '../services/yahooFinance.js';

const router = Router();

// GET /api/quote?symbol=AAPL
router.get('/quote', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    if (!symbol) {
      res.status(400).json({ error: 'Symbol parameter is required' });
      return;
    }

    const quote = await yahooFinance.getQuote(symbol);
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// GET /api/company?symbol=AAPL
router.get('/company', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    if (!symbol) {
      res.status(400).json({ error: 'Symbol parameter is required' });
      return;
    }

    const info = await yahooFinance.getCompanyInfo(symbol);
    res.json(info);
  } catch (error) {
    console.error('Error fetching company info:', error);
    res.status(500).json({ error: 'Failed to fetch company info' });
  }
});

// GET /api/fundamentals?symbol=AAPL
router.get('/fundamentals', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    if (!symbol) {
      res.status(400).json({ error: 'Symbol parameter is required' });
      return;
    }

    const fundamentals = await yahooFinance.getFundamentals(symbol);
    res.json(fundamentals);
  } catch (error) {
    console.error('Error fetching fundamentals:', error);
    res.status(500).json({ error: 'Failed to fetch fundamentals' });
  }
});

// GET /api/historical?symbol=AAPL&range=1y
router.get('/historical', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    const range = (req.query.range as string) || '1y';

    if (!symbol) {
      res.status(400).json({ error: 'Symbol parameter is required' });
      return;
    }

    const data = await yahooFinance.getHistorical(symbol, range);
    res.json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

export default router;
