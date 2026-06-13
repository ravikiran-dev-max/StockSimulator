import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Portfolio from '../models/Portfolio.js';
import { currentPrices } from '../utils/stockPrices.js';
import cloudinary from '../utils/cloudinary.js';

// Get transactions for logged-in user
export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

// Get leaderboard of top traders
export const getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
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

    // Compute net worth (balance + portfolio market value) for each user
    const leaderboardData = users.map(user => {
      const userItems = userPortfolios[user._id.toString()] || [];
      const portfolioValue = userItems.reduce((total, item) => {
        const livePrice = currentPrices[item.symbol] || item.averageBuyPrice;
        return total + (item.quantity * livePrice);
      }, 0);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        balance: user.balance,
        portfolioValue,
        totalWealth: user.balance + portfolioValue
      };
    });

    // Sort by totalWealth in descending order
    leaderboardData.sort((a, b) => b.totalWealth - a.totalWealth);

    res.status(200).json(leaderboardData);
  } catch (error) {
    next(error);
  }
};

// Get activity feed for all users
export const getAllActivities = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({})
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(30);
    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

// Update user profile details (name, email)
export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

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

// Upload profile image to Cloudinary (fallback to base64 data URI if credentials are not configured)
export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload an image file'));
    }

    // Check Cloudinary configuration
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;

    if (!isCloudinaryConfigured) {
      console.warn('Cloudinary environment variables missing. Storing file as base64 Data URI fallback.');
      
      const base64Data = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;

      const user = await User.findById(req.user._id);
      user.profileImage = dataUri;
      await user.save();

      return res.status(200).json({
        message: 'Profile image uploaded successfully (Data URI fallback active)',
        profileImage: dataUri
      });
    }

    // Upload via stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'stock_simulator_avatars' },
      async (error, result) => {
        if (error) {
          return next(new Error('Cloudinary upload failed: ' + error.message));
        }

        const user = await User.findById(req.user._id);
        user.profileImage = result.secure_url;
        await user.save();

        res.status(200).json({
          message: 'Profile image uploaded successfully',
          profileImage: result.secure_url
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    next(error);
  }
};

// Get watchlist
export const getWatchlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    res.status(200).json(user.watchlist || []);
  } catch (error) {
    next(error);
  }
};

// Add ticker to watchlist
export const addToWatchlist = async (req, res, next) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      res.status(400);
      return next(new Error('Symbol is required'));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const upperSymbol = symbol.toUpperCase();
    if (!user.watchlist.includes(upperSymbol)) {
      user.watchlist.push(upperSymbol);
      await user.save();
    }

    res.status(200).json(user.watchlist);
  } catch (error) {
    next(error);
  }
};

// Remove ticker from watchlist
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      res.status(400);
      return next(new Error('Symbol is required'));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const upperSymbol = symbol.toUpperCase();
    user.watchlist = user.watchlist.filter(s => s !== upperSymbol);
    await user.save();

    res.status(200).json(user.watchlist);
  } catch (error) {
    next(error);
  }
};

