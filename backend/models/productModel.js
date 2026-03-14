import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    unit: {
      type: String, // e.g., 'pcs', 'kg', 'boxes'
      required: true,
      default: 'pcs',
    },
    description: {
      type: String,
    },
    image: {
      type: String, // Cloudinary URL
      default: '',
    },
    reorderLevel: {
      type: Number,
      required: true,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text', sku: 'text', category: 'text' });
const Product = mongoose.model('Product', productSchema);
export default Product;
