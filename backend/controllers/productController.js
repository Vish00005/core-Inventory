import Product from "../models/productModel.js";
import Inventory from "../models/inventoryModel.js";
import mongoose from "mongoose";

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404);
      return next(new Error("Product not found"));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Manager/Admin)
export const createProduct = async (req, res, next) => {
  try {
    const { name, sku, category, unit, description, image, reorderLevel } =
      req.body;

    const productExists = await Product.findOne({ sku });
    if (productExists) {
      res.status(400);
      return next(new Error("Product with this SKU already exists"));
    }

    const product = new Product({
      name,
      sku,
      category,
      unit,
      description,
      image,
      reorderLevel,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Manager/Admin)
export const updateProduct = async (req, res, next) => {
  try {
    const { name, sku, category, unit, description, image, reorderLevel } =
      req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      // Check for SKU conflicts if SKU is changed
      if (sku !== product.sku) {
        const skuExists = await Product.findOne({ sku });
        if (skuExists) {
          res.status(400);
          return next(
            new Error("Another product with this SKU already exists"),
          );
        }
      }

      product.name = name || product.name;
      product.sku = sku || product.sku;
      product.category = category || product.category;
      product.unit = unit || product.unit;
      product.description = description || product.description;
      product.image = image !== undefined ? image : product.image;
      product.reorderLevel =
        reorderLevel !== undefined ? reorderLevel : product.reorderLevel;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      return next(new Error("Product not found"));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Manager/Admin)
export const deleteProduct = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(req.params.id).session(session);

    if (product) {
      // 1. Delete associated inventory
      await Inventory.deleteMany({ product: product._id }).session(session);

      // 2. Delete the product itself
      await Product.deleteOne({ _id: product._id }).session(session);

      await session.commitTransaction();
      res.json({ message: "Product and associated inventory removed" });
    } else {
      res.status(404);
      await session.abortTransaction();
      return next(new Error("Product not found"));
    }
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
