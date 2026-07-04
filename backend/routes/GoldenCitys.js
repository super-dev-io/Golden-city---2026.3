import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { createGoldenCity, listGoldenCitys } from '../controllers/goldenCityController.js';

const router = express.Router();

router.get('/', listGoldenCitys);
router.post('/', auth, createGoldenCity);

export default router;
