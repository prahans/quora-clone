import mongoose, { Schema } from "mongoose";

interface PostImage {
  url?: string;
  publicId?: string;
}

interface Post {
  content: string;
  image?: PostImage;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<Post>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Post = mongoose.model<Post>("Post", postSchema);

export default Post;
