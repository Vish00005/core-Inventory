import express from 'express';
import {
  registerUser,
  loginUser,
  requestResetOTP,
  verifyResetOTP,
  resetPassword,
} from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  registerSchema,
  loginSchema,
  requestResetSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../utils/validationSchemas.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/request-reset-otp', validateRequest(requestResetSchema), requestResetOTP);
router.post('/verify-reset-otp', validateRequest(verifyOtpSchema), verifyResetOTP);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

export default router;
