import express from "express";
import {
  getUsers,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes here are protected and require admin role
router.use(protect);
router.use(authorize("admin"));

router.get("/", getUsers);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;
