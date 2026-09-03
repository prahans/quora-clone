import { type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";

import User from "../models/users.ts";
import { createSecretToken } from "../util/secretToken.ts";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email or username already exists",
      });

      return;
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create user
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
    });

    // 4. Create JWT
    const token = createSecretToken(user._id.toString());

    // 5. Store JWT in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    // 6. Send safe user data
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Get credentials from request body
    const { email, password } = req.body;

    // 2. Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });

      return;
    }

    // 3. Find user by email
    const user = await User.findOne({ email });

    // 4. Don't reveal whether the email exists
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

      return;
    }

    // 5. Compare password with stored hash
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

      return;
    }

    // 6. Create JWT
    const token = createSecretToken(user._id.toString());

    // 7. Store JWT in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    // 8. Send successful response
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
