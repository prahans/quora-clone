import { Router } from "express";
import { type Request, type Response } from "express";
import { isValidObjectId } from "mongoose";

import Post from "../models/posts.ts";
import { userVerification } from "../middlewares/authMiddleware.ts";
import { createPost } from "../controllers/postController.ts";
import { upload } from "../middlewares/upload.ts";

const router = Router();

// GET ALL POSTS
router.get("/", userVerification, async (req: Request, res: Response) => {
  try {
    const posts = await Post.find();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Get posts error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET ONE POST
router.get("/:id", userVerification, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ success: false, message: "Invalid post ID" });
    return;
  }

  try {
    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// CREATE POST
router.post("/", userVerification, upload.single("image"), createPost);

// DELETE POST
router.delete("/:id", userVerification, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });

      return;
    }

    if (post.author.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to delete this post",
      });

      return;
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// UPDATE POST
router.put("/:id", userVerification, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });

      return;
    }

    if (post.author.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to edit this post",
      });

      return;
    }

    post.content = content;

    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Update post error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
