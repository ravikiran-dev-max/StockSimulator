import { create } from 'zustand';
import api from '../utils/api';

const useStockStore = create((set, get) => ({
  livePrices: {},
  priceHistory: {
    AAPL: [],
    TSLA: [],
    AMZN: [],
    GOOGL: [],
    MSFT: []
  },
  portfolio: [],
  watchlist: [],
  isLoading: false,
  error: null,

  setLivePrices: (prices) => set((state) => {
    const updatedHistory = { ...state.priceHistory };
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    for (const symbol in prices) {
      if (prices[symbol]) {
        const priceNum = parseFloat(prices[symbol]);
        const ticks = updatedHistory[symbol] || [];
        updatedHistory[symbol] = [
          ...ticks.slice(-19), // Cap price history at last 20 entries
          { time: timeLabel, price: priceNum }
        ];
      }
    }

    return { 
      livePrices: prices,
      priceHistory: updatedHistory 
    };
  }),

  setPortfolio: (portfolio) => set({ portfolio }),
  setWatchlist: (watchlist) => set({ watchlist }),

  fetchPortfolio: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/stocks/portfolio');
      set({ portfolio: data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch portfolio', isLoading: false });
    }
  },

  fetchWatchlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/users/watchlist');
      set({ watchlist: data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch watchlist', isLoading: false });
    }
  },

  addToWatchlist: async (symbol) => {
    try {
      const { data } = await api.post('/users/watchlist', { symbol });
      set({ watchlist: data });
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }
  },

  removeFromWatchlist: async (symbol) => {
    try {
      const { data } = await api.delete(`/users/watchlist/${symbol}`);
      set({ watchlist: data });
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  },
}));

export default useStockStore;

