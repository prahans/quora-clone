import { api } from "../api";
import type { Post } from "../types/post";

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

export async function createPost(content: string): Promise<Post> {
  const response = await api.post<Post>("/api/posts", { content });
  return response.data;
}

export async function updatePost({ id, content }: { id: string; content: string }): Promise<Post> {
  const response = await api.put<{ post: Post }>(`/api/posts/${id}`, { content });
  return response.data.post;
}
