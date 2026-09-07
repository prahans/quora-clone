import type { Request, Response } from "express";

import Post from "../models/posts.ts";
import { uploadImage } from "../services/imageService.ts";

export async function getPosts(req: Request, res: Response) {
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
