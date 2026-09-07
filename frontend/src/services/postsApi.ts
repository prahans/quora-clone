import { api } from "../api";
import type {
  CreatePostInput,
  Post,
  UpdatePostInput,
  UpdatePostResult,
} from "../types/post";

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
  image,
  removeImage,
}: UpdatePostInput): Promise<UpdatePostResult> {
  let payload: FormData | { content: string; removeImage?: boolean } = {
    content,
    ...(removeImage !== undefined && { removeImage }),
  };

  if (image) {
    payload = new FormData();
    payload.append("content", content);
    payload.append("image", image);
    if (removeImage !== undefined) {
      payload.append("removeImage", String(removeImage));
    }
  }

  const response = await api.put<UpdatePostResult>(`/api/posts/${id}`, payload);
  return response.data;
}
