import mongoose from 'mongoose';

const removedStockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true }
}, { timestamps: true });

export default mongoose.model('RemovedStock', removedStockSchema);
