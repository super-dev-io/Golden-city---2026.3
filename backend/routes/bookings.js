import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { createBooking, listBookings } from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', auth, createBooking);
router.get('/', auth, listBookings);

export default router;
