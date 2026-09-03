import mongoose, { Schema, type Document } from "mongoose";

export interface User extends Document {
  email: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: [true, "Your email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: [true, "Your username is required"],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Your password is required"],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model<User>("User", userSchema);

export default User;
