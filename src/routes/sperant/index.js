import { Router } from 'express';
import sendClientToQueue from '../../services/sperant/sync/queue/producer/sendClientToQueue';
import updateClient from './updateClient';
import updateDeal from './updateDeal';

const router = Router();
router.post("/sync", sendClientToQueue);
router.post("/updateClient", updateClient);
router.post("/updateDeal", updateDeal);

export default router;
