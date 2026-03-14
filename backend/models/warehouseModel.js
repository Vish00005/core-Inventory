import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 2,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    rooms: {
      type: [String],
      default: ["Main Area"],
    },
  },
  {
    timestamps: true,
  },
);

const Warehouse = mongoose.model("Warehouse", warehouseSchema);
export default Warehouse;
