import mongoose, { Schema } from "mongoose";

interface Post {
  author: mongoose.Types.ObjectId;
  username: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<Post>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Post = mongoose.model<Post>("Post", postSchema);

export default Post;
