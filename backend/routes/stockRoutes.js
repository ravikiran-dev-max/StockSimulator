import express from 'express';
import { buyStock, sellStock, getPortfolio, searchStocks } from '../controllers/stockController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/buy', protect, buyStock);
router.post('/sell', protect, sellStock);
router.get('/portfolio', protect, getPortfolio);
router.get('/search', protect, searchStocks);

export default router;
