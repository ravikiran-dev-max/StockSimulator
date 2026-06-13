export const getStockName = (symbol) => {
  if (!symbol) return '';
  
  const mapping = {
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
  
  return mapping[symbol.toUpperCase()] || `${symbol.toUpperCase()} Inc.`;
};
