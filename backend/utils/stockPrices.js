export let currentPrices = {
  AAPL: 150.00,
  TSLA: 200.00,
  AMZN: 100.00,
  GOOGL: 2800.00,
  MSFT: 300.00
};

export const updatePrices = (newPrices) => {
  for (const symbol in newPrices) {
    if (newPrices[symbol]) {
      currentPrices[symbol] = parseFloat(newPrices[symbol]);
    }
  }
};
