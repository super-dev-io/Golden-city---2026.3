import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { me, listUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', auth, me);
router.get('/', auth, listUsers);

export default router;
