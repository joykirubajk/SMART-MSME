import express from 'express';
import { recommendSchemes, getAllSchemes } from '../controllers/schemeController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();


router.post('/recommend', authMiddleware, recommendSchemes);


router.get('/', getAllSchemes);


export default router;