import type { User } from "../models/users.ts";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
