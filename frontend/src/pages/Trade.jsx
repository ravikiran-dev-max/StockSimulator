import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, DollarSign, Wallet, RefreshCw, AlertCircle, TrendingUp, Sparkles, TrendingDown, Search } from 'lucide-react';
import api from '../utils/api';
import useStockStore from '../store/useStockStore';
import useAuthStore from '../store/useAuthStore';
import useNotificationStore from '../store/useNotificationStore';
import { getStockName } from '../utils/stockHelpers';

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla Motors' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' }
];

export default function Trade() {
  const location = useLocation();
  const { user, updateBalance } = useAuthStore();
  const { livePrices, priceHistory, portfolio, fetchPortfolio } = useStockStore();
  const { addNotification } = useNotificationStore();

  // Selected states
  const [symbol, setSymbol] = useState('AAPL');
  const [action, setAction] = useState('BUY'); // 'BUY' or 'SELL'
  const [quantity, setQuantity] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Search states inside Trade page
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Debounced search query fetch
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
        console.error('Error fetching stock search results in trade page:', error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user?.token]);

  // Close search results dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse state from router transitions (e.g., Quick Sell from Portfolio page)
  useEffect(() => {
    if (location.state?.selectedSymbol) {
      setSymbol(location.state.selectedSymbol);
    }
    if (location.state?.actionType) {
      setAction(location.state.actionType);
    }
  }, [location.state]);

  // Fetch initial user portfolio and user transactions
  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/users/transactions');
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchPortfolio();
      fetchTransactions();
    }
  }, [user?.token]);

  // Dynamic values
  const currentPrice = livePrices[symbol] ? parseFloat(livePrices[symbol]) : 0;
  const parsedQty = parseFloat(quantity) || 0;
  const estimatedTotal = parsedQty * currentPrice;

  // Stock history chart data
  const historyData = priceHistory[symbol] || [];

  // Calculate price trend color based on last two ticks
  const isUpTrend = historyData.length >= 2 
    ? historyData[historyData.length - 1].price >= historyData[historyData.length - 2].price 
    : true;

  // Inventory/funds checks
  const ownedShares = portfolio.find((item) => item.symbol === symbol)?.quantity || 0;
  const isInsufficientFunds = action === 'BUY' && estimatedTotal > user.balance;
  const isInsufficientShares = action === 'SELL' && parsedQty > ownedShares;
  const isValidTrade = parsedQty > 0 && !isInsufficientFunds && !isInsufficientShares;

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    if (!isValidTrade || isTrading) return;

    setIsTrading(true);
    setTradeMessage(null);
    setErrorMessage(null);

    const endpoint = action === 'BUY' ? 'buy' : 'sell';
    const totalOrderValue = quantity * currentPrice;

    try {
      const { data } = await api.post(
        `/stocks/${endpoint}`,
        {
          symbol,
          quantity: parsedQty,
          currentPrice
        }
      );

      // Success Message
      setTradeMessage(data.message);
      setQuantity('');
      
      // Update balance globally in Zustand
      updateBalance(data.balance);
      
      // Log Success Notification
      addNotification(
        `Order Successful: ${action}`,
        `Successfully ${action === 'BUY' ? 'purchased' : 'sold'} ${parsedQty} shares of ${symbol} at $${currentPrice.toFixed(2)} each (Total: $${totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`
      );

      // Refresh portfolio and transaction log
      await fetchPortfolio();
      await fetchTransactions();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Trading failed. Try again.';
      setErrorMessage(errMsg);
      
      // Log Failure Notification
      addNotification(
        `Order Failed: ${action} ${symbol}`,
        `Failed to execute order: ${errMsg}`
      );
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trade Center</h2>
          <p className="text-muted-foreground">Instantly trade stocks and see live ticking price charts.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Left Side: Live Price Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-4 bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-start">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative" ref={searchRef}>
                  <div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-foreground tracking-tight">{symbol}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={getStockName(symbol)}>
                        {getStockName(symbol)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Real-time dynamic price tracking</p>
                  </div>
                  <div className="relative">
                    <div className="flex items-center space-x-1.5 bg-input/40 border border-border rounded-xl px-2.5 py-1 focus-within:ring-2 focus-within:ring-primary/50 transition-all w-full sm:w-48">
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search ticker..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSearchResults(true);
                        }}
                        onFocus={() => setShowSearchResults(true)}
                        className="bg-transparent border-none p-0 text-xs font-semibold text-foreground focus:outline-none focus:ring-0 w-full placeholder:text-muted-foreground/50"
                      />
                    </div>
                    {/* Autocomplete list */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute top-9 left-0 w-full bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-1.5 z-50 max-h-[180px] overflow-y-auto">
                        {searchResults.map((stock) => (
                          <button
                            key={stock.symbol}
                            type="button"
                            onClick={() => {
                              setSymbol(stock.symbol);
                              setSearchQuery('');
                              setShowSearchResults(false);
                              setQuantity('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-muted/50 transition-all text-left text-xs"
                          >
                            <div className="truncate mr-2">
                              <span className="font-extrabold text-foreground">{stock.symbol}</span>
                              <span className="text-[10px] text-muted-foreground ml-1.5 truncate max-w-[80px] inline-block align-bottom">{stock.name}</span>
                            </div>
                            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold flex-shrink-0">Select</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              <div className="text-right">
                <span className="text-3xl font-extrabold text-foreground block">
                  ${currentPrice ? currentPrice.toFixed(2) : '...'}
                </span>
                <span className={`text-xs font-bold flex items-center justify-end ${isUpTrend ? 'text-green-500' : 'text-red-500'}`}>
                  {isUpTrend ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  Live Ticking
                </span>
              </div>
            </div>

            {/* Recharts Live AreaChart */}
            <div className="h-[280px] w-full pt-4">
              {historyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm animate-pulse">
                  Connecting to live price streams...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isUpTrend ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isUpTrend ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      minTickGap={20}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `$${val.toFixed(1)}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={isUpTrend ? '#10b981' : '#ef4444'} 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Side: Order Panel */}
        <div className="md:col-span-3 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-base flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2 text-primary" />
                  Order Panel
                </h3>
                <div className="flex space-x-1.5 bg-muted/65 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAction('BUY')}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      action === 'BUY' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction('SELL')}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      action === 'SELL' ? 'bg-red-500 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              <form onSubmit={handleTradeSubmit} className="space-y-4">
                {/* Quantity Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Order Quantity (Shares)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      placeholder="0.00"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-input/40 border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold text-sm"
                    />
                    {action === 'SELL' && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        Owned: {ownedShares}
                      </span>
                    )}
                  </div>
                </div>

                {/* Estimate box */}
                <div className="bg-muted/30 border border-border/50 p-3.5 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Price</span>
                    <span>${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground border-t border-border/40 pt-1.5 mt-1.5">
                    <span>Est. Total {action === 'BUY' ? 'Cost' : 'Credit'}</span>
                    <span>${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Errors/success notifications */}
                <AnimatePresence mode="wait">
                  {isInsufficientFunds && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg flex items-center space-x-2"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Insufficient funds. Available cash: ${user.balance.toLocaleString()}.</span>
                    </motion.div>
                  )}

                  {isInsufficientShares && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg flex items-center space-x-2"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Insufficient shares. You only own {ownedShares} of {symbol}.</span>
                    </motion.div>
                  )}

                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg flex items-center space-x-2"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}

                  {tradeMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-green-500/10 text-green-500 text-xs p-3 rounded-lg flex items-center space-x-2"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{tradeMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!isValidTrade || isTrading}
                  className={`w-full font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-xs uppercase tracking-wider ${
                    !isValidTrade
                      ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                      : action === 'BUY'
                      ? 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/20'
                      : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                  }`}
                >
                  {isTrading ? (
                    <RefreshCw className="animate-spin h-4 w-4" />
                  ) : (
                    <span>Execute {action}</span>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Buying Power Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-card/30 to-accent/5 backdrop-blur-md rounded-2xl border border-border p-4 shadow-sm flex justify-between items-center"
          >
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Buying Power</span>
              <span className="text-xl font-black text-foreground block">
                ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* User Transaction Logs */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm"
      >
        <h3 className="font-semibold text-lg mb-4 flex items-center">
          <RefreshCw className="h-5 w-5 mr-2 text-primary" />
          Your Transaction History
        </h3>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">No transaction records found.</div>
        ) : (
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-medium sticky top-0 bg-card">
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2">Ticker</th>
                  <th className="py-2.5 px-2">Shares</th>
                  <th className="py-2.5 px-2">Price</th>
                  <th className="py-2.5 px-2 text-right">Total</th>
                  <th className="py-2.5 px-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold inline-block ${
                          t.type === 'BUY'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-bold text-foreground">{t.symbol}</td>
                    <td className="py-2.5 px-2">{t.quantity}</td>
                    <td className="py-2.5 px-2">${t.price.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-foreground">
                      ${(t.quantity * t.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

