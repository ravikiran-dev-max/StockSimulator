import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import useStockStore from '../store/useStockStore';

export default function StockSparkline({ symbol, height = 40 }) {
  const priceHistory = useStockStore((state) => state.priceHistory);
  const history = priceHistory[symbol] || [];

  if (history.length < 2) {
    return (
      <div 
        className="w-full flex items-center justify-center text-[10px] text-muted-foreground animate-pulse" 
        style={{ height }}
      >
        Awaiting feeds...
      </div>
    );
  }

  // Determine trend: compare last price with the first price in the history array
  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;
  const isUp = lastPrice >= firstPrice;
  const strokeColor = isUp ? '#10b981' : '#ef4444'; // Green vs Red
  const gradientId = `sparkGradient-${symbol}`;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={history} 
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
