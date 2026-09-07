import { api } from "../api";
import type { CreatePostInput, Post } from "../types/post";

export async function getPosts(signal?: AbortSignal): Promise<Post[]> {
  const response = await api.get<Post[]>("/api/posts", { signal });

  return response.data;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/api/posts/${id}`);
}

export async function getPost(id: string, signal?: AbortSignal): Promise<Post> {
  const response = await api.get<Post>(`/api/posts/${id}`, { signal });
  return response.data;
}

export async function createPost({
  content,
  image,
}: CreatePostInput): Promise<Post> {
  const formData = new FormData();

  formData.append("content", content);

  if (image) {
    formData.append("image", image);
  }

  const response = await api.post<{ post: Post }>("/api/posts", formData);

  return response.data.post;
}

export async function updatePost({
  id,
  content,
}: {
  id: string;
  content: string;
}): Promise<Post> {
  const response = await api.put<{ post: Post }>(`/api/posts/${id}`, {
    content,
  });
  return response.data.post;
}
