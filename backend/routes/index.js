import express from 'express';
import requestRoutes from './requestRoutes.js';

const router = express.Router();

router.use('/requests', requestRoutes);

export default router;