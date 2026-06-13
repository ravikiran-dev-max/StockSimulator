import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Briefcase, TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react';
import useStockStore from '../store/useStockStore';
import useAuthStore from '../store/useAuthStore';
import StockSparkline from '../components/StockSparkline';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Portfolio() {
  const { user } = useAuthStore();
  const { portfolio, livePrices, fetchPortfolio, isLoading } = useStockStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.token) {
      fetchPortfolio();
    }
  }, [user?.token, fetchPortfolio]);

  // Calculate dynamic portfolio valuations based on live prices
  const portfolioWithLivePrices = portfolio.map((item) => {
    const currentPrice = livePrices[item.symbol] ? parseFloat(livePrices[item.symbol]) : item.averageBuyPrice;
    const totalCost = item.quantity * item.averageBuyPrice;
    const currentValue = item.quantity * currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercentage = totalCost ? (profitLoss / totalCost) * 100 : 0;

    return {
      ...item,
      currentPrice,
      totalCost,
      currentValue,
      profitLoss,
      profitLossPercentage,
    };
  });

  const totalInvested = portfolioWithLivePrices.reduce((sum, item) => sum + item.totalCost, 0);
  const currentValue = portfolioWithLivePrices.reduce((sum, item) => sum + item.currentValue, 0);
  const totalReturn = currentValue - totalInvested;
  const returnPercentage = totalInvested ? (totalReturn / totalInvested) * 100 : 0;

  // Pie chart data
  const pieData = portfolioWithLivePrices.map((item) => ({
    name: item.symbol,
    value: parseFloat(item.currentValue.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
          <p className="text-muted-foreground">Manage and track your active assets in real-time.</p>
        </div>
        <Link
          to="/dashboard/trade"
          className="bg-primary text-primary-foreground font-medium px-4 py-2 rounded-xl hover:bg-primary/95 transition-all flex items-center space-x-2 shadow-lg shadow-primary/20"
        >
          <Briefcase className="h-4 w-4" />
          <span>Trade Center</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Invested</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-1">Cost basis of all assets</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Current Value</h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-1">Live market valuation</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total P&L</h3>
            {totalReturn >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
          </div>
          <div className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className={`text-xs mt-1 font-semibold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalReturn >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}% ROI
          </p>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-4 bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm overflow-hidden"
        >
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-primary" />
            Asset Holdings
          </h3>

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground animate-pulse">Loading holdings...</div>
          ) : portfolioWithLivePrices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>You don't own any stocks yet.</p>
              <Link to="/dashboard/trade" className="text-primary hover:underline font-medium text-sm mt-2 block">
                Buy your first stock
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-medium">
                    <th className="py-3 px-2">Symbol</th>
                    <th className="py-3 px-2">Shares</th>
                    <th className="py-3 px-2">Avg Buy Price</th>
                    <th className="py-3 px-2">Current Price</th>
                    <th className="py-3 px-2">Live Trend</th>
                    <th className="py-3 px-2 text-right">Total P&L</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {portfolioWithLivePrices.map((item) => (
                    <tr key={item.symbol} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-2 font-bold text-foreground">{item.symbol}</td>
                      <td className="py-3.5 px-2">{item.quantity}</td>
                      <td className="py-3.5 px-2">${item.averageBuyPrice.toFixed(2)}</td>
                      <td className="py-3.5 px-2 font-semibold text-foreground">${item.currentPrice.toFixed(2)}</td>
                      <td className="py-3.5 px-2 min-w-[90px] max-w-[120px]">
                        <StockSparkline symbol={item.symbol} height={25} />
                      </td>
                      <td className={`py-3.5 px-2 text-right font-medium ${item.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="block">${item.profitLoss >= 0 ? '+' : ''}{item.profitLoss.toFixed(2)}</span>
                        <span className="text-xs block opacity-80">
                          {item.profitLoss >= 0 ? '+' : ''}{item.profitLossPercentage.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          onClick={() => navigate('/dashboard/trade', { state: { selectedSymbol: item.symbol, actionType: 'SELL' } })}
                          className="text-xs bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-semibold px-3 py-1.5 rounded-lg transition-all"
                        >
                          Quick Sell
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Asset Allocation Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-3 bg-card/40 backdrop-blur-md rounded-2xl border border-border p-6 shadow-sm flex flex-col"
        >
          <h3 className="font-semibold text-lg mb-4 flex items-center">
            <PieIcon className="h-5 w-5 mr-2 text-primary" />
            Asset Allocation
          </h3>
          <div className="flex-1 min-h-[240px] flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">No allocations. Trade assets to see visual summary.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
