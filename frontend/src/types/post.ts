export type Post = {
  _id: string;
  author: string;
  username: string;
  content: string;
};

export interface CreatePostInput {
  content: string;
  image?: File;
}
