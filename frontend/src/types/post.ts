export interface PostAuthor {
  _id: string;
  username: string;
}

export interface PostImage {
  url: string;
  publicId: string;
}

export interface Post {
  _id: string;
  content: string;
  image?: PostImage;
  author: PostAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  content: string;
  image?: File;
}

export interface UpdatePostInput extends CreatePostInput {
  id: string;
  removeImage?: boolean;
}

export interface UpdatePostResult {
  post: Post;
  warning?: string;
}
