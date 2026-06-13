import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Plus, Trash2, ArrowUpRight, TrendingUp, Briefcase, Search } from 'lucide-react';
import useStockStore from '../store/useStockStore';
import useAuthStore from '../store/useAuthStore';
import StockSparkline from '../components/StockSparkline';
import { getStockName } from '../utils/stockHelpers';
import api from '../utils/api';

export default function Watchlist() {
  const { user } = useAuthStore();
  const { watchlist, livePrices, fetchWatchlist, addToWatchlist, removeFromWatchlist, isLoading } = useStockStore();
  const navigate = useNavigate();

  // Autocomplete search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.token) {
      fetchWatchlist();
    }
  }, [user?.token, fetchWatchlist]);

  // Debounced stock search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get(`/stocks/search?q=${searchQuery}`);
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching stocks:', error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user?.token]);

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemove = async (symbol) => {
    if (!user?.token) return;
    await removeFromWatchlist(symbol);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Watchlist</h2>
          <p className="text-muted-foreground">Keep an eye on key stocks and trade instantly.</p>
        </div>

        {/* Quick Add Search and Autocomplete */}
        <div className="relative w-full sm:w-80" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search ticker to add (e.g. AAPL)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-input/40 border border-border rounded-xl py-2 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-semibold"
            />
          </div>

          {/* Autocomplete list */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-11 left-0 w-full bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-2 z-50 max-h-[220px] overflow-y-auto">
              {searchResults.map((stock) => {
                const isAlreadyAdded = watchlist.includes(stock.symbol);
                return (
                  <button
                    key={stock.symbol}
                    onClick={async () => {
                      if (!isAlreadyAdded) {
                        await addToWatchlist(stock.symbol);
                      }
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    disabled={isAlreadyAdded}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/50 transition-all text-left text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div>
                      <span className="font-extrabold text-foreground">{stock.symbol}</span>
                      <span className="text-[10px] text-muted-foreground ml-2 truncate max-w-[150px] inline-block align-bottom">{stock.name}</span>
                    </div>
                    {isAlreadyAdded ? (
                      <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Added</span>
                    ) : (
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">Add</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid of Watchlisted Stocks */}
      {isLoading && watchlist.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground animate-pulse">Loading watchlist...</div>
      ) : watchlist.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-12 text-center text-muted-foreground shadow-sm"
        >
          <Activity className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4 animate-pulse" />
          <h4 className="text-lg font-bold text-foreground mb-1">Your Watchlist is Empty</h4>
          <p className="text-sm max-w-md mx-auto mb-4">
            Select a stock ticker from the selector above to monitor real-time pricing and trends.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {watchlist.map((symbol) => {
              const name = getStockName(symbol);
              const price = livePrices[symbol] ? parseFloat(livePrices[symbol]) : null;

              return (
                <motion.div
                  key={symbol}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-2xl font-black text-foreground block tracking-tight">{symbol}</span>
                      <span className="text-xs text-muted-foreground block truncate max-w-[160px]">{name}</span>
                    </div>
                    <button
                      onClick={() => handleRemove(symbol)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="my-4">
                    {price !== null ? (
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-3xl font-extrabold text-foreground">${price.toFixed(2)}</span>
                          <span className="text-[10px] text-green-500 font-bold flex items-center bg-green-500/10 px-2 py-0.5 rounded-lg">
                            Live
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm animate-pulse">Awaiting market data...</span>
                    )}

                    {/* Sparkline Graph */}
                    <div className="mt-4">
                      <StockSparkline symbol={symbol} height={50} />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => navigate('/dashboard/trade', { state: { selectedSymbol: symbol, actionType: 'BUY' } })}
                      className="flex-1 bg-primary text-primary-foreground font-semibold py-2 rounded-xl hover:bg-primary/95 transition-all text-xs flex items-center justify-center space-x-1 shadow-lg shadow-primary/10"
                    >
                      <Briefcase className="h-3 w-3" />
                      <span>Buy</span>
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/trade', { state: { selectedSymbol: symbol, actionType: 'SELL' } })}
                      className="flex-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-semibold py-2 rounded-xl transition-all text-xs flex items-center justify-center space-x-1"
                    >
                      <TrendingUp className="h-3 w-3 rotate-90" />
                      <span>Sell</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
