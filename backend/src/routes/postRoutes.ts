import { Router } from "express";
import { userVerification } from "../middlewares/authMiddleware.ts";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  updatePost,
} from "../controllers/postController.ts";
import { upload } from "../middlewares/upload.ts";

const router = Router();

// GET ALL POSTS
router.get("/", userVerification, getPosts);

// GET ONE POST
router.get("/:id", userVerification, getPost);

// CREATE POST
router.post("/", userVerification, upload.single("image"), createPost);

// DELETE POST
router.delete("/:id", userVerification, deletePost);

// UPDATE POST
router.put("/:id", userVerification, updatePost);

export default router;
