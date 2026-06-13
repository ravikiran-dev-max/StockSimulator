import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  quantity: { type: Number, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  price: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
