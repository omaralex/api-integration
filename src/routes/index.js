import { Router } from 'express';
import sperant from './sperant';
import hubspot from './hubspot';
import health from './health';

const router = Router();
router.use("/sperant", sperant);
router.use("/hubspot", hubspot);
router.use("/health", health);

export default router;
