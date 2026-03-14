import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

const inspectIndexes = async () => {
  try {
    await connectDB();
    console.log('--- MongoDB Index Inspection ---');

    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const col of collections) {
      console.log(`\nCollection: ${col.name}`);
      const indexes = await mongoose.connection.db.collection(col.name).indexes();
      console.log(JSON.stringify(indexes, null, 2));
    }

    console.log('\n--- Inspection Complete ---');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error during index inspection: ${error}`);
    process.exit(1);
  }
};

inspectIndexes();
