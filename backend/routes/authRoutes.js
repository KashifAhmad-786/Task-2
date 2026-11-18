import { Router } from 'express';

import { registerUser, loginUser } from '../controllers/authController.js';
import { handleValidationErrors } from '../middleware/validateMiddleware.js';
import { loginValidation, registerValidation } from '../validators/authValidator.js';

const router = Router();

router.post('/register', registerValidation, handleValidationErrors, registerUser);
router.post('/login', loginValidation, handleValidationErrors, loginUser);

export default router;
