import { updatePrices, currentPrices } from '../utils/stockPrices.js';

export const initializeSockets = (io) => {
  // Start a single global interval to simulate and broadcast stock prices
  setInterval(() => {
    const newPrices = {};
    for (const symbol in currentPrices) {
      const oldPrice = currentPrices[symbol];
      // Generate a random walk of up to +/- 1.5%
      const changePercent = (Math.random() * 3 - 1.5) / 100;
      const newPrice = Math.max(1.00, oldPrice * (1 + changePercent));
      newPrices[symbol] = parseFloat(newPrice.toFixed(2));
    }
    
    // Update the in-memory global prices
    updatePrices(newPrices);
    
    // Broadcast to all connected clients
    io.emit('stock_prices', newPrices);
  }, 2000); // Emit every 2 seconds

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Immediately send the current live prices to the newly connected socket
    socket.emit('stock_prices', currentPrices);

    // Join a specific room for user updates
    socket.on('join_user_room', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

