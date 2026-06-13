import express from 'express';
import { 
  getTransactions, 
  getLeaderboard, 
  getAllActivities, 
  updateUserProfile, 
  uploadProfileImage,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/transactions', protect, getTransactions);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/activities', protect, getAllActivities);

router.put('/profile', protect, updateUserProfile);
router.post('/profile/image', protect, upload.single('image'), uploadProfileImage);

router.route('/watchlist')
  .get(protect, getWatchlist)
  .post(protect, addToWatchlist);

router.delete('/watchlist/:symbol', protect, removeFromWatchlist);

export default router;

