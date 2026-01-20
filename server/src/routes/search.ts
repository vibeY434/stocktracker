import { Router, type Request, type Response } from 'express';
import { yahooFinance } from '../services/yahooFinance.js';

const router = Router();

// GET /api/search?q=apple
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 1) {
      res.json([]);
      return;
    }

    const results = await yahooFinance.search(query);
    res.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
