import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.TOKEN_KEY;

if (!JWT_SECRET) {
  throw new Error("TOKEN_KEY is not defined in environment variables");
}

export const createSecretToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: 3 * 24 * 60 * 60, // 3 days in seconds
  });
};
