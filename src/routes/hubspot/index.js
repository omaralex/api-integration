import { Router } from 'express';
import sync from './sync';

const router = Router();
router.post("/sync", sync);

export default router;
