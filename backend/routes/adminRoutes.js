import express from 'express';
import { 
  getAllUsers, 
  updateUserProfileAdmin, 
  getAllActivities, 
  removeStock, 
  getRemovedStocks, 
  restoreStock 
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect and admin middleware to all routes
router.use(protect);
router.use(admin);

// Users management routes
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserProfileAdmin);

// Activities route
router.get('/activities', getAllActivities);

// Stock controls routes
router.get('/stocks/removed', getRemovedStocks);
router.post('/stocks/remove', removeStock);
router.delete('/stocks/removed/:symbol', restoreStock);

export default router;
