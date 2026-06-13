import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  averageBuyPrice: { type: Number, required: true, min: 0 },
}, { timestamps: true });

// Ensure unique compound index
portfolioSchema.index({ user: 1, symbol: 1 }, { unique: true });

export default mongoose.model('Portfolio', portfolioSchema);
