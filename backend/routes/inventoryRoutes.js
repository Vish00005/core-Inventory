import express from 'express';
import {
  getInventory,
  processReceipt,
  processDelivery,
  processTransfer,
  processAdjustment,
  getTransactions,
  completeTransaction,
} from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  receiptSchema,
  deliverySchema,
  transferSchema,
  adjustmentSchema
} from '../utils/inventoryValidationSchemas.js';

const router = express.Router();

router.get('/', protect, getInventory);
router.get('/transactions', protect, getTransactions);

router.post('/receipt', protect, authorize('manager', 'staff', 'admin'), validateRequest(receiptSchema), processReceipt);
router.post('/delivery', protect, authorize('manager', 'staff', 'admin'), validateRequest(deliverySchema), processDelivery);
router.post('/transfer', protect, authorize('manager', 'staff', 'admin'), validateRequest(transferSchema), processTransfer);
router.post('/adjustment', protect, authorize('manager', 'admin'), validateRequest(adjustmentSchema), processAdjustment);
router.post('/transactions/:id/complete', protect, authorize('manager', 'staff', 'admin'), completeTransaction);

export default router;
