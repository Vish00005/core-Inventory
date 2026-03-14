import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/userModel.js";
import Product from "./models/productModel.js";
import Warehouse from "./models/warehouseModel.js";
import Inventory from "./models/inventoryModel.js";
import Transaction from "./models/transactionModel.js";
import Supplier from "./models/supplierModel.js";
import OTP from "./models/otpModel.js";
import Counter from "./models/counterModel.js";
import connectDB from "./config/db.js";
import bcrypt from "bcryptjs";

dotenv.config();

connectDB();

const importData = async () => {
  try {
    console.log("--- Database Reset Initiated ---");

    // Clear all existing data
    console.log("Clearing existing collections...");
    await User.deleteMany();
    await Product.deleteMany();
    await Warehouse.deleteMany();
    await Inventory.deleteMany();
    await Transaction.deleteMany();
    await Supplier.deleteMany();
    await OTP.deleteMany();
    await Counter.deleteMany();
    console.log("✅ Database cleared.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Password@123", salt);

    console.log("Seeding Users...");
    const createdUsers = await User.insertMany([
      {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
      },
      {
        name: "Manager User",
        email: "manager@example.com",
        password: hashedPassword,
        role: "manager",
        isVerified: true,
      },
      {
        name: "Staff User",
        email: "staff@example.com",
        password: hashedPassword,
        role: "staff",
        isVerified: true,
      },
    ]);

    const adminUser = createdUsers[0]._id;

    console.log("Seeding Warehouses...");
    const createdWarehouses = await Warehouse.insertMany([
      {
        name: "Central Warehouse NYC",
        code: "WH",
        location: "New York, NY",
        description: "Main distribution center",
        rooms: ["Main Area", "Floor 1", "Floor 2"],
      },
      {
        name: "West Coast Hub LA",
        code: "LA",
        location: "Los Angeles, CA",
        description: "West coast fulfillment",
        rooms: ["Main Area", "Dock A", "Dock B"],
      },
    ]);

    console.log("Seeding Products...");
    const createdProducts = await Product.insertMany([
      {
        name: "Laptop Pro 15",
        sku: "LP-15-BLA",
        category: "Electronics",
        unit: "pcs",
        description: "15 inch professional laptop",
        reorderLevel: 50,
      },
      {
        name: "Wireless Mouse",
        sku: "WM-01-GRY",
        category: "Accessories",
        unit: "pcs",
        description: "Ergonomic wireless mouse",
        reorderLevel: 100,
      },
      {
        name: "Desk Chair Ergonomic",
        sku: "FUR-CH-ERG",
        category: "Furniture",
        unit: "pcs",
        description: "Office desk chair",
        reorderLevel: 20,
      },
      {
        name: "USB-C Cable 2m",
        sku: "ACC-CBL-2M",
        category: "Accessories",
        unit: "pcs",
        description: "Braided USB-C to USB-C cable",
        reorderLevel: 200,
      },
      {
        name: 'Monitor 4K 27"',
        sku: "MON-27-4K",
        category: "Electronics",
        unit: "pcs",
        description: "UHD Color accurate monitor",
        reorderLevel: 15,
      },
    ]);

    console.log("Initializing Inventory levels...");
    const inventoryItems = [];

    // Distribute products in warehouses
    for (const product of createdProducts) {
      // Put some in Warehouse 1, Main Area
      inventoryItems.push({
        product: product._id,
        warehouse: createdWarehouses[0]._id,
        room: "Main Area",
        quantity: Math.floor(Math.random() * 50) + product.reorderLevel,
      });
      // Put some in Warehouse 2, Main Area
      inventoryItems.push({
        product: product._id,
        warehouse: createdWarehouses[1]._id,
        room: "Main Area",
        quantity: Math.floor(Math.random() * 30) + 10,
      });
    }

    await Inventory.insertMany(inventoryItems);

    console.log("✅ Data seeded successfully!");
    console.log("--- Database Reset Complete ---");
    process.exit();
  } catch (error) {
    console.error(`❌ Error with data import: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    console.log("⚠️ Destroying all data...");
    await User.deleteMany();
    await Product.deleteMany();
    await Warehouse.deleteMany();
    await Inventory.deleteMany();
    await Transaction.deleteMany();
    await Supplier.deleteMany();
    await OTP.deleteMany();
    await Counter.deleteMany();

    console.log("🔥 Data Destroyed!");
    process.exit();
  } catch (error) {
    console.error(`❌ Error with data destroy: ${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
