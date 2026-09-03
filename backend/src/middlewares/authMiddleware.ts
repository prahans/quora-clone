import "dotenv/config";

import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

import User from "../models/users.ts";

interface JwtPayload {
  id: string;
}

export const userVerification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.TOKEN_KEY!) as JwtPayload;

    // 3. Find user from the ID stored in JWT
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    // 4. Attach authenticated user to request
    req.user = user;

    // 5. Continue to the next middleware/controller
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
