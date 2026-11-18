import { Router } from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import { handleValidationErrors } from '../middleware/validateMiddleware.js';
import {
  createFarm,
  deleteFarm,
  getFarmById,
  getFarms,
  updateFarm,
} from '../controllers/farmController.js';
import {
  createFarmValidation,
  farmIdValidation,
  updateFarmValidation,
} from '../validators/farmValidator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createFarmValidation, handleValidationErrors, createFarm);
router.get('/', getFarms);
router.get('/:id', farmIdValidation, handleValidationErrors, getFarmById);
router.put('/:id', updateFarmValidation, handleValidationErrors, updateFarm);
router.delete('/:id', farmIdValidation, handleValidationErrors, deleteFarm);

export default router;
