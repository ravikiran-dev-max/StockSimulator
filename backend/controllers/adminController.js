import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';
import RemovedStock from '../models/RemovedStock.js';
import { currentPrices } from '../utils/stockPrices.js';

// Get all users with their stats
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    const portfolios = await Portfolio.find({});

    // Group portfolios by user ID
    const userPortfolios = {};
    portfolios.forEach(item => {
      const uId = item.user.toString();
      if (!userPortfolios[uId]) {
        userPortfolios[uId] = [];
      }
      userPortfolios[uId].push(item);
    });

    const usersData = users.map(user => {
      const userItems = userPortfolios[user._id.toString()] || [];
      const portfolioValue = userItems.reduce((total, item) => {
        const livePrice = currentPrices[item.symbol] || item.averageBuyPrice;
        return total + (item.quantity * livePrice);
      }, 0);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        profileImage: user.profileImage,
        portfolioValue,
        totalWealth: user.balance + portfolioValue,
        createdAt: user.createdAt
      };
    });

    res.status(200).json(usersData);
  } catch (error) {
    next(error);
  }
};

// Update any user profile (admin bypass)
export const updateUserProfileAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, balance } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400);
        return next(new Error('Email is already taken'));
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (balance !== undefined && !isNaN(Number(balance))) user.balance = Number(balance);

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      balance: updatedUser.balance,
      profileImage: updatedUser.profileImage,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// Get all transaction logs across the entire system
export const getAllActivities = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({})
      .populate('user', 'name email profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

// Blacklist a stock symbol
export const removeStock = async (req, res, next) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      res.status(400);
      return next(new Error('Stock symbol is required'));
    }

    const upperSymbol = symbol.trim().toUpperCase();

    // Check if already blacklisted
    const existing = await RemovedStock.findOne({ symbol: upperSymbol });
    if (existing) {
      res.status(400);
      return next(new Error(`Stock ${upperSymbol} is already removed`));
    }

    // Add to RemovedStock
    await RemovedStock.create({ symbol: upperSymbol });

    // Clean up all user watchlists
    await User.updateMany(
      { watchlist: upperSymbol },
      { $pull: { watchlist: upperSymbol } }
    );

    res.status(200).json({ message: `Stock ${upperSymbol} successfully removed` });
  } catch (error) {
    next(error);
  }
};

// Get all blacklisted stocks
export const getRemovedStocks = async (req, res, next) => {
  try {
    const removed = await RemovedStock.find({}).sort({ symbol: 1 });
    res.status(200).json(removed);
  } catch (error) {
    next(error);
  }
};

// Restore a blacklisted stock symbol
export const restoreStock = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      res.status(400);
      return next(new Error('Stock symbol is required'));
    }

    const upperSymbol = symbol.trim().toUpperCase();

    const removed = await RemovedStock.findOneAndDelete({ symbol: upperSymbol });
    if (!removed) {
      res.status(404);
      return next(new Error(`Stock ${upperSymbol} not found in removed stocks`));
    }

    res.status(200).json({ message: `Stock ${upperSymbol} successfully restored` });
  } catch (error) {
    next(error);
  }
};
