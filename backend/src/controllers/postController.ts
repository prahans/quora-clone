import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import Post from "../models/posts.ts";
import { uploadImage } from "../services/imageService.ts";

export async function getPosts(req: Request, res: Response) {
  try {
    const posts = await Post.find()
      .populate("author", "username")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Get posts error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function createPost(req: Request, res: Response) {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    let image:
      | {
          url: string;
          publicId: string;
        }
      | undefined;

    if (req.file) {
      const uploadedImage = await uploadImage(req.file.buffer);

      image = {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
      };
    }

    const post = await Post.create({
      author: req.user!._id,
      content: content.trim(),
      image,
    });

    await post.populate("author", "username");

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getPost(req: Request, res: Response) {
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
}

export async function deletePost(req: Request, res: Response) {
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
}

export async function updatePost(req: Request, res: Response) {
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
}
