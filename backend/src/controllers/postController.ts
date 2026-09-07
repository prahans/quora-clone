import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import Post from "../models/posts.ts";
import { deleteImage, uploadImage } from "../services/imageService.ts";
import { getImageUploadFailure } from "../services/imageUploadErrors.ts";

async function cleanupUnsavedImage(publicId: string | undefined) {
  if (!publicId) return;

  try {
    await deleteImage(publicId);
  } catch (error) {
    console.error("Unsaved image cleanup error:", { publicId, error });
  }
}

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
    const { content } = req.body ?? {};

    if (typeof content !== "string" || !content.trim()) {
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
      try {
        const uploadedImage = await uploadImage(req.file.buffer);

        image = {
          url: uploadedImage.secure_url,
          publicId: uploadedImage.public_id,
        };
      } catch (error) {
        const failure = getImageUploadFailure(error);
        console.error("Image upload error:", error);

        return res.status(failure.status).json({
          success: false,
          code: failure.code,
          message: failure.message,
        });
      }
    }

    const post = await Post.create({
      author: req.user!._id,
      content: content.trim(),
      image,
    }).catch(async (error: unknown) => {
      await cleanupUnsavedImage(image?.publicId);
      throw error;
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
    const post = await Post.findById(id).populate("author", "username");

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

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid post ID" });
      return;
    }

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

    if (post.image?.publicId) {
      try {
        await deleteImage(post.image.publicId);
      } catch (error) {
        console.error("Post image deletion error:", error);
        res.status(502).json({
          success: false,
          code: "IMAGE_DELETE_FAILED",
          message: "Could not delete the image. Your post was not deleted. Please try again.",
        });
        return;
      }
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
    const { content, removeImage } = req.body ?? {};

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid post ID" });
      return;
    }

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

    if (typeof content !== "string" || !content.trim()) {
      res.status(400).json({ success: false, message: "Content is required" });
      return;
    }

    if (![undefined, true, false, "true", "false"].includes(removeImage)) {
      res.status(400).json({ success: false, message: "Invalid removeImage value" });
      return;
    }

    const shouldRemoveImage = removeImage === true || removeImage === "true";

    if (shouldRemoveImage && req.file) {
      res.status(400).json({
        success: false,
        message: "Choose either a replacement image or image removal",
      });
      return;
    }

    const previousPublicId = post.image?.publicId;
    let replacementImage: { url: string; publicId: string } | undefined;

    if (req.file) {
      try {
        const uploadedImage = await uploadImage(req.file.buffer);
        replacementImage = {
          url: uploadedImage.secure_url,
          publicId: uploadedImage.public_id,
        };
      } catch (error) {
        const failure = getImageUploadFailure(error);
        console.error("Image upload error:", error);
        res.status(failure.status).json({
          success: false,
          code: failure.code,
          message: failure.message,
        });
        return;
      }
    }

    post.content = content.trim();
    if (replacementImage) {
      post.image = replacementImage;
    } else if (shouldRemoveImage) {
      post.image = undefined;
    }

    const updatedPost = await post.save().catch(async (error: unknown) => {
      await cleanupUnsavedImage(replacementImage?.publicId);
      throw error;
    });

    let warning: string | undefined;
    if (previousPublicId && (replacementImage || shouldRemoveImage)) {
      try {
        await deleteImage(previousPublicId);
      } catch (error) {
        console.error("Previous image cleanup error:", { publicId: previousPublicId, error });
        warning = "Post updated, but the previous image could not be removed from image storage.";
      }
    }

    await updatedPost.populate("author", "username");

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error("Update post error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
