import { Router } from 'express';
import { getSettingsController, updateSettingsController } from '../controllers/settingsController.js';

const router = Router();

router.get('/', getSettingsController);
router.patch('/', updateSettingsController);

export default router;
