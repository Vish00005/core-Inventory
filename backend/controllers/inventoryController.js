import Inventory from "../models/inventoryModel.js";
import Transaction from "../models/transactionModel.js";
import Product from "../models/productModel.js";
import Warehouse from "../models/warehouseModel.js";
import Counter from "../models/counterModel.js";
import mongoose from "mongoose";

// Helper to update inventory balance
const updateInventoryBlock = async (
  productId,
  warehouseId,
  room,
  quantity,
  session,
) => {
  let inventory = await Inventory.findOne({
    product: productId,
    warehouse: warehouseId,
    room,
  }).session(session);

  if (!inventory) {
    if (quantity < 0)
      throw new Error(
        `Cannot reduce stock below 0 for uninitialized inventory in ${room}`,
      );
    inventory = new Inventory({
      product: productId,
      warehouse: warehouseId,
      room,
      quantity: 0,
    });
  }

  inventory.quantity += quantity;

  if (inventory.quantity < 0) {
    throw new Error("Insufficient stock in warehouse");
  }

  await inventory.save({ session });
  return inventory;
};

// Helper to generate custom transaction ID
const generateFormattedId = async (warehouseId, type, session) => {
  const warehouse = await Warehouse.findById(warehouseId).session(session);
  if (!warehouse || !warehouse.code) {
    throw new Error(`Warehouse ${warehouseId} not found or missing code`);
  }

  const typeMap = {
    RECEIPT: "IN",
    DELIVERY: "OUT",
    TRANSFER: "TR",
    ADJUSTMENT: "AD",
  };

  const opCode = typeMap[type];

  // Atomic increment for the counter
  const counter = await Counter.findOneAndUpdate(
    { warehouseId, type },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session },
  );

  const sequence = counter.seq.toString().padStart(3, "0");
  return `${warehouse.code}/${opCode}/${sequence}`;
};

// @desc    Get all inventory with filtering
// @route   GET /api/inventory
// @access  Private
export const getInventory = async (req, res, next) => {
  try {
    const { warehouse, room, category, isLowStock } = req.query;

    let filter = {};
    if (warehouse) filter.warehouse = warehouse;
    if (room) filter.room = room;

    // To filter by product category, we need to populate first or lookup.
    // For simplicity, we can fetch all, populate, and then filter in memory if category/isLowStock is provided,
    // Or use aggregation. We'll use populate and memory filter for small scale, aggregation for production scale.
    // Given Mongoose, we'll populate product.

    let inventory = await Inventory.find(filter)
      .populate("product")
      .populate("warehouse", "name location rooms");

    if (category) {
      inventory = inventory.filter((inv) => inv.product.category === category);
    }
    if (isLowStock === "true") {
      inventory = inventory.filter(
        (inv) => inv.quantity <= inv.product.reorderLevel,
      );
    }

    res.json(inventory);
  } catch (error) {
    next(error);
  }
};

// @desc    Process Receipt (Incoming)
// @route   POST /api/inventory/receipt
// @access  Private
// Body: { items: [{ product: id, warehouse: id, room: string, quantity: number }], notes: string }
export const processReceipt = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, notes, status } = req.body;
    const finalStatus = status || "COMPLETED";

    if (!items || items.length === 0) {
      throw new Error("No items provided for receipt");
    }

    const transactions = [];

    for (const item of items) {
      const { product, warehouse, room, quantity } = item;

      if (quantity <= 0) throw new Error("Quantity must be greater than 0");
      if (!room) throw new Error("Room is required for receiving inventory");

      if (finalStatus === "COMPLETED") {
        await updateInventoryBlock(product, warehouse, room, quantity, session);
      }

      const formattedId = await generateFormattedId(
        warehouse,
        "RECEIPT",
        session,
      );

      transactions.push({
        product,
        type: "RECEIPT",
        quantity,
        destinationWarehouse: warehouse,
        destinationRoom: room,
        status: finalStatus,
        createdBy: req.user._id,
        notes,
        formattedId,
        completedAt: finalStatus === "COMPLETED" ? new Date() : undefined,
      });
    }

    const createdTransactions = await Transaction.insertMany(transactions, {
      session,
    });

    await session.commitTransaction();
    res.status(201).json({
      message: "Receipt processed successfully",
      transactions: createdTransactions,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400);
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Process Delivery (Outgoing)
// @route   POST /api/inventory/delivery
// @access  Private
export const processDelivery = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, notes, status } = req.body;
    const finalStatus = status || "COMPLETED";

    if (!items || items.length === 0) {
      throw new Error("No items provided for delivery");
    }

    const transactions = [];

    for (const item of items) {
      const { product, warehouse, room, quantity } = item;

      if (quantity <= 0) throw new Error("Quantity must be greater than 0");
      if (!room) throw new Error("Room is required for fulfilling a delivery");

      // reduce inventory only if completed
      if (finalStatus === "COMPLETED") {
        await updateInventoryBlock(
          product,
          warehouse,
          room,
          -quantity,
          session,
        );
      }

      const formattedId = await generateFormattedId(
        warehouse,
        "DELIVERY",
        session,
      );

      transactions.push({
        product,
        type: "DELIVERY",
        quantity,
        sourceWarehouse: warehouse,
        sourceRoom: room,
        status: finalStatus,
        createdBy: req.user._id,
        notes,
        formattedId,
        completedAt: finalStatus === "COMPLETED" ? new Date() : undefined,
      });
    }

    const createdTransactions = await Transaction.insertMany(transactions, {
      session,
    });

    await session.commitTransaction();
    res.status(201).json({
      message: "Delivery processed successfully",
      transactions: createdTransactions,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400);
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Process Transfer (Warehouse A to B, or Room A to B)
// @route   POST /api/inventory/transfer
// @access  Private
export const processTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      items,
      sourceWarehouse,
      destinationWarehouse,
      sourceRoom,
      destinationRoom,
      notes,
    } = req.body;

    if (!items || items.length === 0)
      throw new Error("No items provided for transfer");

    if (
      sourceWarehouse === destinationWarehouse &&
      sourceRoom === destinationRoom
    ) {
      throw new Error(
        "Source and destination cannot be the exact same warehouse and room",
      );
    }

    if (!sourceRoom || !destinationRoom) {
      throw new Error(
        "Both source room and destination room must be specified",
      );
    }

    const transactions = [];

    for (const item of items) {
      const { product, quantity } = item;

      if (quantity <= 0) throw new Error("Quantity must be greater than 0");

      // reduce from source
      await updateInventoryBlock(
        product,
        sourceWarehouse,
        sourceRoom,
        -quantity,
        session,
      );
      // increase in destination
      await updateInventoryBlock(
        product,
        destinationWarehouse,
        destinationRoom,
        quantity,
        session,
      );

      const formattedId = await generateFormattedId(
        sourceWarehouse,
        "TRANSFER",
        session,
      );

      transactions.push({
        product,
        type: "TRANSFER",
        quantity,
        sourceWarehouse,
        sourceRoom,
        destinationWarehouse,
        destinationRoom,
        createdBy: req.user._id,
        notes,
        formattedId,
        completedAt: new Date(),
      });
    }

    const createdTransactions = await Transaction.insertMany(transactions, {
      session,
    });

    await session.commitTransaction();
    res.status(201).json({
      message: "Transfer processed successfully",
      transactions: createdTransactions,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400);
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Process Adjustment
// @route   POST /api/inventory/adjustment
// @access  Private (Manager/Admin)
export const processAdjustment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, notes } = req.body;
    // items: [{ product, warehouse, room, newQuantity }]

    if (!items || items.length === 0)
      throw new Error("No items provided for adjustment");

    const transactions = [];

    for (const item of items) {
      const { product, warehouse, room, newQuantity } = item;

      if (newQuantity < 0) throw new Error("Quantity cannot be negative");
      if (!room) throw new Error("Room is required for inventory adjustments");

      let inventory = await Inventory.findOne({
        product,
        warehouse,
        room,
      }).session(session);
      let currentQuantity = inventory ? inventory.quantity : 0;

      const diff = newQuantity - currentQuantity;

      if (diff === 0) continue; // no adjustment needed

      if (!inventory) {
        inventory = new Inventory({ product, warehouse, room, quantity: 0 });
      }

      inventory.quantity = newQuantity;
      await inventory.save({ session });

      const formattedId = await generateFormattedId(
        warehouse,
        "ADJUSTMENT",
        session,
      );

      transactions.push({
        product,
        type: "ADJUSTMENT",
        quantity: Math.abs(diff), // Storing absolute difference
        sourceWarehouse: diff < 0 ? warehouse : undefined,
        sourceRoom: diff < 0 ? room : undefined,
        destinationWarehouse: diff > 0 ? warehouse : undefined,
        destinationRoom: diff > 0 ? room : undefined,
        createdBy: req.user._id,
        notes: notes || `Adjusted from ${currentQuantity} to ${newQuantity}`,
        formattedId,
        completedAt: new Date(),
      });
    }

    let createdTransactions = [];
    if (transactions.length > 0) {
      createdTransactions = await Transaction.insertMany(transactions, {
        session,
      });
    }

    await session.commitTransaction();
    res.status(201).json({
      message: "Adjustment processed successfully",
      transactions: createdTransactions,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400);
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get transaction history
// @route   GET /api/inventory/transactions
// @access  Private
export const getTransactions = async (req, res, next) => {
  try {
    const { type, warehouse, status } = req.query;

    let filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (warehouse) {
      filter.$or = [
        { sourceWarehouse: warehouse },
        { destinationWarehouse: warehouse },
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate("product", "name sku")
      .populate("sourceWarehouse", "name")
      .populate("destinationWarehouse", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a PENDING transaction
// @route   POST /api/inventory/transactions/:id/complete
// @access  Private (Manager/Admin/Staff matching type)
export const completeTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transaction = await Transaction.findById(req.params.id).session(
      session,
    );

    if (!transaction) {
      res.status(404);
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "PENDING") {
      res.status(400);
      throw new Error("Can only complete PENDING transactions");
    }

    // Update inventory
    if (transaction.type === "RECEIPT") {
      await updateInventoryBlock(
        transaction.product,
        transaction.destinationWarehouse,
        transaction.destinationRoom,
        transaction.quantity,
        session,
      );
    } else if (transaction.type === "DELIVERY") {
      await updateInventoryBlock(
        transaction.product,
        transaction.sourceWarehouse,
        transaction.sourceRoom,
        -transaction.quantity,
        session,
      );
    } else {
      throw new Error(
        "Status transition only supported for RECEIPTS and DELIVERIES",
      );
    }

    transaction.status = "COMPLETED";
    transaction.completedAt = new Date();
    await transaction.save({ session });

    await session.commitTransaction();
    res.json({ message: "Transaction marked as completed", transaction });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Update transaction status (Pending <-> Completed)
// @route   PATCH /api/inventory/transactions/:id/status
// @access  Private (Manager/Admin)
export const updateTransactionStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id).session(
      session,
    );

    if (!transaction) {
      res.status(404);
      throw new Error("Transaction not found");
    }

    if (transaction.status === status) {
      return res.json({
        message: "Status is already set to " + status,
        transaction,
      });
    }

    // Safety Lock: Don't allow COMPLETED transactions to go back to PENDING or CANCELLED
    if (transaction.status === "COMPLETED") {
      res.status(400);
      throw new Error(
        "Finalized transactions cannot be reverted to Pending or Cancelled.",
      );
    }

    // Logic:
    // 1. PENDING -> COMPLETED: Perform normal increase/decrease
    // 2. COMPLETED -> PENDING: Reverse the original increase/decrease (REMOVED/DISABLED based on user request)
    // 3. COMPLETED -> CANCELLED: Reverse the original increase/decrease (REMOVED/DISABLED based on user request)

    const isApplying =
      transaction.status === "PENDING" && status === "COMPLETED";

    if (isApplying) {
      if (transaction.type === "RECEIPT") {
        await updateInventoryBlock(
          transaction.product,
          transaction.destinationWarehouse,
          transaction.destinationRoom,
          transaction.quantity,
          session,
        );
      } else if (transaction.type === "DELIVERY") {
        await updateInventoryBlock(
          transaction.product,
          transaction.sourceWarehouse,
          transaction.sourceRoom,
          -transaction.quantity,
          session,
        );
      }
    }

    transaction.status = status;
    if (status === "COMPLETED") {
      transaction.completedAt = new Date();
    }
    await transaction.save({ session });

    await session.commitTransaction();
    res.json({ message: `Status updated to ${status}`, transaction });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
