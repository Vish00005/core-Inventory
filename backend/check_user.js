import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const check = async () => {
  const users = await User.find({});
  console.log('Users:', users.map(u => ({ email: u.email, role: u.role, password: u.password })));
  process.exit();
};

check();
