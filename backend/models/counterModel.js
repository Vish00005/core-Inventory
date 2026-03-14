import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  type: {
    type: String,
    enum: ["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"],
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

// Unique counter per warehouse per transaction type
counterSchema.index({ warehouseId: 1, type: 1 }, { unique: true });

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
