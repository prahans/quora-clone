import { Router } from "express";
import { type Request, type Response } from "express";
import Post from "../models/posts.ts";
import { userVerification } from "../middlewares/authMiddleware.ts";

const router = Router();

router.get("/", userVerification, async (req: Request, res: Response) => {
  const data = await Post.find();
  res.json(data);
});

router.post("/", userVerification, async (req: Request, res: Response) => {
  const { username, content } = req.body;
  const data = await Post.create({
    username,
    content,
  });
  res.status(201).json(data);
});

// Added the forward slash right before :id
router.delete("/:id", userVerification, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // 1. Delete the document from your MongoDB cluster via Mongoose
    const deletedPost = await Post.findByIdAndDelete(id);

    // 2. Check if the post actually existed
    if (!deletedPost) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // 3. Return a successful 200 code along with the deleted object back to React
    res.status(200).json(deletedPost);
  } catch (error) {
    console.error("Database deletion error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Using PUT or PATCH for modifications (e.g., /posts/:id)
router.put("/:id", userVerification, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, content } = req.body; // Extract fields coming from React

  try {
    // 1. Update the document.
    // { new: true } returns the fresh, updated object back instead of the old one.
    // { runValidators: true } ensures the new updates follow your Mongoose schema rules.
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { username, content },
      { new: true, runValidators: true },
    );

    // 2. Check if the post existed
    if (!updatedPost) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // 3. Send the updated post back to React so it can refresh the UI state
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
