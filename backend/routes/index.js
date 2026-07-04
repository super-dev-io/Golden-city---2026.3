import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import eventRoutes from './events.js';
import GoldenCityRoutes from './GoldenCitys.js';
import bookingRoutes from './bookings.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/GoldenCitys', GoldenCityRoutes);
router.use('/bookings', bookingRoutes);

export default router;
