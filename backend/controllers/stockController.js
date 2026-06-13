import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import RemovedStock from '../models/RemovedStock.js';
import { currentPrices } from '../utils/stockPrices.js';

// Buy stock
export const buyStock = async (req, res, next) => {
  const { symbol, quantity, price: bodyPrice, currentPrice } = req.body;
  const userId = req.user._id;

  try {
    const upperSymbol = (symbol || '').toUpperCase();
    const isRemoved = await RemovedStock.findOne({ symbol: upperSymbol });
    if (isRemoved) {
      res.status(400);
      return next(new Error('This stock has been removed by the administrator and cannot be traded.'));
    }

    const qty = Number(quantity);
    const price = Number(bodyPrice !== undefined ? bodyPrice : currentPrice);

    if (isNaN(qty) || qty <= 0) {
      res.status(400);
      return next(new Error('Invalid quantity'));
    }

    if (isNaN(price) || price <= 0) {
      res.status(400);
      return next(new Error('Invalid price'));
    }

    const user = await User.findById(userId);
    const totalCost = qty * price;

    if (user.balance < totalCost) {
      res.status(400);
      return next(new Error('Insufficient funds'));
    }

    // Deduct balance
    user.balance -= totalCost;
    await user.save();

    // Add to portfolio
    let portfolioItem = await Portfolio.findOne({ user: userId, symbol });
    
    if (portfolioItem) {
      const totalValue = (portfolioItem.quantity * portfolioItem.averageBuyPrice) + totalCost;
      portfolioItem.quantity += qty;
      portfolioItem.averageBuyPrice = totalValue / portfolioItem.quantity;
      await portfolioItem.save();
    } else {
      portfolioItem = await Portfolio.create({
        user: userId,
        symbol,
        quantity: qty,
        averageBuyPrice: price
      });
    }

    // Log transaction
    await Transaction.create({
      user: userId,
      symbol,
      quantity: qty,
      type: 'BUY',
      price
    });

    res.status(200).json({ 
      message: 'Stock purchased successfully', 
      balance: user.balance, 
      portfolioItem 
    });
  } catch (error) {
    next(error);
  }
};

// Sell stock
export const sellStock = async (req, res, next) => {
  const { symbol, quantity, price: bodyPrice, currentPrice } = req.body;
  const userId = req.user._id;

  try {
    const upperSymbol = (symbol || '').toUpperCase();
    const isRemoved = await RemovedStock.findOne({ symbol: upperSymbol });
    if (isRemoved) {
      res.status(400);
      return next(new Error('This stock has been removed by the administrator and cannot be traded.'));
    }

    const qty = Number(quantity);
    const price = Number(bodyPrice !== undefined ? bodyPrice : currentPrice);

    if (isNaN(qty) || qty <= 0) {
      res.status(400);
      return next(new Error('Invalid quantity'));
    }

    if (isNaN(price) || price <= 0) {
      res.status(400);
      return next(new Error('Invalid price'));
    }

    const portfolioItem = await Portfolio.findOne({ user: userId, symbol });

    if (!portfolioItem || portfolioItem.quantity < qty) {
      res.status(400);
      return next(new Error('Insufficient stock quantity'));
    }

    const totalRevenue = qty * price;

    // Add to balance
    const user = await User.findById(userId);
    user.balance += totalRevenue;
    await user.save();

    // Update portfolio
    portfolioItem.quantity -= qty;
    if (portfolioItem.quantity === 0) {
      await Portfolio.findByIdAndDelete(portfolioItem._id);
    } else {
      await portfolioItem.save();
    }

    // Log transaction
    await Transaction.create({
      user: userId,
      symbol,
      quantity: qty,
      type: 'SELL',
      price
    });

    res.status(200).json({ 
      message: 'Stock sold successfully', 
      balance: user.balance 
    });
  } catch (error) {
    next(error);
  }
};

// Get Portfolio
export const getPortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });
    res.status(200).json(portfolio);
  } catch (error) {
    next(error);
  }
};

const GLOBAL_STOCKS_MAPPING = {
  AAPL: 'Apple Inc.',
  TSLA: 'Tesla Motors',
  AMZN: 'Amazon.com, Inc.',
  GOOGL: 'Alphabet Inc.',
  MSFT: 'Microsoft Corporation',
  NVDA: 'NVIDIA Corporation',
  NFLX: 'Netflix, Inc.',
  META: 'Meta Platforms, Inc.',
  AMD: 'Advanced Micro Devices, Inc.',
  COIN: 'Coinbase Global, Inc.',
  BABA: 'Alibaba Group Holding Limited',
  JPM: 'JPMorgan Chase & Co.',
  DIS: 'The Walt Disney Company',
  PYPL: 'PayPal Holdings, Inc.',
  V: 'Visa Inc.',
  INTC: 'Intel Corporation',
  NKE: 'Nike, Inc.',
  SBUX: 'Starbucks Corporation',
  WMT: 'Walmart Inc.'
};

// Search stocks globally
export const searchStocks = async (req, res, next) => {
  try {
    const query = (req.query.q || '').trim().toUpperCase();
    if (!query) {
      return res.status(200).json([]);
    }

    let results = [];

    // Try fetching real stocks from Yahoo Finance API first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.quotes) {
          results = data.quotes
            .filter(q => q.quoteType === 'EQUITY' && q.symbol)
            .map(q => ({
              symbol: q.symbol.toUpperCase(),
              name: q.shortname || q.longname || `${q.symbol} Inc.`
            }));
        }
      }
    } catch (fetchError) {
      console.warn('Yahoo Finance search API fetch failed. Using fallback:', fetchError.message);
    }

    // Fallback if Yahoo search failed or returned no results
    if (results.length === 0) {
      for (const symbol in GLOBAL_STOCKS_MAPPING) {
        const name = GLOBAL_STOCKS_MAPPING[symbol];
        if (symbol.includes(query) || name.toUpperCase().includes(query)) {
          results.push({ symbol, name });
        }
      }

      // Dynamic fallback: allow query ticker format (1-5 letters)
      if (query.match(/^[A-Z0-9.-]{1,10}$/) && !GLOBAL_STOCKS_MAPPING[query]) {
        results.push({ symbol: query, name: `${query} Inc.` });
      }
    }

    // Filter out removed (blacklisted) stocks
    const removedStocksList = await RemovedStock.find({});
    const removedSymbols = new Set(removedStocksList.map(s => s.symbol.toUpperCase()));
    results = results.filter(stock => !removedSymbols.has(stock.symbol));

    // Register active price stream and fetch real market price if possible
    for (const stock of results) {
      if (!currentPrices[stock.symbol]) {
        let priceResolved = false;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          const priceRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}`, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
            }
          });
          clearTimeout(timeoutId);

          if (priceRes.ok) {
            const chartData = await priceRes.json();
            const realPrice = chartData.chart?.result?.[0]?.meta?.regularMarketPrice;
            if (realPrice && !isNaN(realPrice)) {
              currentPrices[stock.symbol] = parseFloat(realPrice.toFixed(2));
              priceResolved = true;
            }
          }
        } catch (err) {
          // Keep default simulated fallback
        }

        if (!priceResolved) {
          // Generate a deterministic initial price based on hash
          let hash = 0;
          for (let i = 0; i < stock.symbol.length; i++) {
            hash = stock.symbol.charCodeAt(i) + ((hash << 5) - hash);
          }
          const startPrice = Math.abs(hash % 300) + 15;
          currentPrices[stock.symbol] = parseFloat(startPrice.toFixed(2));
        }
      }
    }

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

