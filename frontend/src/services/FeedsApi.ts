import { api } from "../api";
import type { Post } from "../types/post";

export async function getFeeds(): Promise<Post[]> {
  const response = await api.get<Post[]>("/api/posts");

  return response.data;
}
