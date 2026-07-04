import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { createEvent, listEvents, getEvent } from '../controllers/eventController.js';

const router = express.Router();

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', auth, createEvent);

export default router;
