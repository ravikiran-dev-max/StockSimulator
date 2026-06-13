import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useStockStore from '../store/useStockStore';
import useAuthStore from '../store/useAuthStore';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import api from '../utils/api';
import StockSparkline from '../components/StockSparkline';
import { getStockName } from '../utils/stockHelpers';

// Mock chart data for initial load
const generateMockChartData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    name: `Day ${i + 1}`,
    value: 10000 + Math.random() * 2000 - 500 + (i * 100),
  }));
};

export default function Dashboard() {
  const livePrices = useStockStore((state) => state.livePrices);
  const user = useAuthStore((state) => state.user);
  const [chartData] = useState(generateMockChartData());
  const [portfolio, setPortfolio] = useState([]);
  const [aiInsights, setAiInsights] = useState('Loading insights...');

  useEffect(() => {
    // Fetch user portfolio
    const fetchPortfolio = async () => {
      try {
        const { data } = await api.get('/stocks/portfolio');
        setPortfolio(data);
      } catch (error) {
        console.error('Error fetching portfolio', error);
      }
    };
    if (user?.token) {
      fetchPortfolio();
    }
  }, [user?.token]);

  useEffect(() => {
    // Fetch AI insights
    const fetchInsights = async () => {
      try {
        const { data } = await api.post('/ai/insights', {
          portfolioData: portfolio
        });
        setAiInsights(data.insights);
      } catch (error) {
        setAiInsights('AI analysis currently unavailable.');
      }
    };
    if (user?.token && portfolio.length >= 0) { // Fetch even if empty for general advice
        fetchInsights();
    }
  }, [portfolio, user?.token]);

  // Calculate stats
  const totalInvested = portfolio.reduce((acc, item) => acc + (item.quantity * item.averageBuyPrice), 0);
  const currentValue = portfolio.reduce((acc, item) => {
    const currentPrice = livePrices[item.symbol] || item.averageBuyPrice;
    return acc + (item.quantity * currentPrice);
  }, 0);
  const totalReturns = currentValue - totalInvested;
  const returnsPercentage = totalInvested ? ((totalReturns / totalInvested) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user.name}. Here's your market overview.</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">${user.balance.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Available for trading</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Portfolio Value</h3>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-1">Current market value</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Returns</h3>
            {totalReturns >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </div>
          <div className={`text-2xl font-bold ${totalReturns >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${totalReturns >= 0 ? '+' : ''}{totalReturns.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{returnsPercentage}% all time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/50 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Market Status</h3>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-green-500">OPEN</div>
          <p className="text-xs text-muted-foreground mt-1">Live data active</p>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="col-span-4 bg-card/50 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm"
        >
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Portfolio Performance</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Assistant & Live Prices */}
        <div className="col-span-3 space-y-4 flex flex-col">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-md rounded-2xl border border-primary/20 p-6 shadow-sm overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24" />
            </div>
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full mr-2">AI</span>
              Stock Assistant
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed overflow-y-auto max-h-[120px]">
              {aiInsights}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex-1 bg-card/50 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm overflow-hidden"
          >
            <h3 className="font-semibold text-lg mb-4">Live Market</h3>
            <div className="space-y-3">
              {Object.entries(livePrices).map(([symbol, price], i) => (
                <div key={symbol} className="flex justify-between items-center p-2 rounded-xl hover:bg-muted/50 transition-all gap-4">
                  <div className="flex flex-col min-w-[60px] truncate">
                    <span className="font-extrabold text-sm text-foreground">{symbol}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{getStockName(symbol)}</span>
                  </div>

                  {/* Sparkline in the middle */}
                  <div className="flex-1 max-w-[100px] h-8 flex items-center">
                    <StockSparkline symbol={symbol} height={28} />
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm block">${parseFloat(price).toFixed(2)}</span>
                    <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-md inline-block mt-0.5">Live</span>
                  </div>
                </div>
              ))}
              {Object.keys(livePrices).length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">Waiting for market data...</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
