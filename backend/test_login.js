import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/userModel.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const test = async () => {
  const user = await User.findOne({ email: "manager@example.com" });
  if (!user) {
    console.log("User not found");
  } else {
    const match = await user.matchPassword("password123");
    console.log("Match for password123:", match);
  }
  process.exit();
};

test();
