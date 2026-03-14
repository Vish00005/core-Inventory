import express from "express";
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../controllers/warehouseController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";
import { warehouseSchema } from "../utils/warehouseValidationSchemas.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getWarehouses)
  .post(
    protect,
    authorize("admin", "manager"),
    validateRequest(warehouseSchema),
    createWarehouse,
  );

router
  .route("/:id")
  .get(protect, getWarehouseById)
  .put(
    protect,
    authorize("admin", "manager"),
    validateRequest(warehouseSchema),
    updateWarehouse,
  )
  .delete(protect, authorize("admin"), deleteWarehouse);

export default router;
