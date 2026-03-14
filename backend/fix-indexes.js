import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

const fixIndexes = async () => {
  try {
    await connectDB();
    console.log('--- MongoDB Index Maintenance ---');

    console.log('Fetching collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const inventoryCollection = collections.find(c => c.name === 'inventories');

    if (inventoryCollection) {
      console.log('Dropping all indexes on "inventories" collection...');
      await mongoose.connection.db.collection('inventories').dropIndexes();
      console.log('✅ Indexes dropped.');
    } else {
      console.log('⚠️ "inventories" collection not found.');
    }

    console.log('Indexes will be recreated automatically by Mongoose on next application start or seeder run.');
    console.log('--- Maintenance Complete ---');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error during index maintenance: ${error}`);
    process.exit(1);
  }
};

fixIndexes();
