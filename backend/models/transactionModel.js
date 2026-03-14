import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      enum: ["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    sourceWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      // required for DELIVERY, TRANSFER
    },
    sourceRoom: {
      type: String,
    },
    destinationWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      // required for RECEIPT, TRANSFER
    },
    destinationRoom: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: "COMPLETED",
    },
    formattedId: {
      type: String,
      unique: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
