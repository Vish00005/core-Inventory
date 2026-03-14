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
        name: "Vishal Khimsuriya",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
      },
      {
        name: "Amit Patel",
        email: "manager@example.com",
        password: hashedPassword,
        role: "manager",
        isVerified: true,
      },
      {
        name: "Sneha Mehta",
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
        name: "Ahmedabad Mega Hub",
        code: "AM",
        location: "Ahmedabad, Gujarat",
        description: "Primary distribution center for North Gujarat",
        rooms: ["Ground Floor", "Mezzanine", "Cold Storage"],
      },
      {
        name: "Surat Textile Center",
        code: "ST",
        location: "Surat, Gujarat",
        description: "Diamond and Textile logistics hub",
        rooms: ["Main Hall", "High Security Vault", "Export Dock"],
      },
      {
        name: "Rajkot Engineering Zone",
        code: "RZ",
        location: "Rajkot, Gujarat",
        description: "Industrial components and machinery hub",
        rooms: ["Heavy Machining Area", "Parts Store", "Loading Bay"],
      },
    ]);

    console.log("Seeding Products...");
    const createdProducts = await Product.insertMany([
      {
        name: "Cotton Yarn - Grade A",
        sku: "TEX-COT-001",
        category: "Textiles",
        unit: "bales",
        description: "High-quality raw cotton yarn for weaving",
        reorderLevel: 100,
      },
      {
        name: "Polished Diamond 0.5ct",
        sku: "JWL-DIA-P5",
        category: "Jewelry",
        unit: "pcs",
        description: "VVS1 clarity round brilliant cut diamond",
        reorderLevel: 10,
      },
      {
        name: "Ceramic Wall Tiles 12x18",
        sku: "BLD-CER-1218",
        category: "Building Material",
        unit: "boxes",
        description: "Premium vitrified wall tiles from Morbi",
        reorderLevel: 200,
      },
      {
        name: "Groundnut Oil 15L",
        sku: "FOD-OIL-GN15",
        category: "Food & Beverage",
        unit: "tins",
        description: "Pure filtered groundnut oil",
        reorderLevel: 150,
      },
      {
        name: "Brass Valve 1/2 inch",
        sku: "ENG-BRS-V12",
        category: "Engineering",
        unit: "pcs",
        description: "Precision engineered brass valve from Jamnagar",
        reorderLevel: 500,
      },
    ]);

    console.log("Initializing Inventory levels...");
    const inventoryItems = [];

    // Distribute products in warehouses
    for (const product of createdProducts) {
      // Put some in Ahmedabad, Ground Floor
      inventoryItems.push({
        product: product._id,
        warehouse: createdWarehouses[0]._id,
        room: "Ground Floor",
        quantity: Math.floor(Math.random() * 50) + product.reorderLevel,
      });
      // Put some in Surat, Main Hall
      inventoryItems.push({
        product: product._id,
        warehouse: createdWarehouses[1]._id,
        room: "Main Hall",
        quantity: Math.floor(Math.random() * 30) + 20,
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
