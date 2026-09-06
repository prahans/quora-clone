import axios from "axios";
import { api } from "../api";
import type { CurrentUser, LoginInput, SignupInput } from "../types/auth";

type UserResponse = {
  user: CurrentUser;
};

export async function getCurrentUser(
  signal?: AbortSignal,
): Promise<CurrentUser | null> {
  try {
    const response = await api.get<UserResponse>("/api/auth/me", { signal });
    return response.data.user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function login(input: LoginInput): Promise<CurrentUser> {
  const response = await api.post<UserResponse>("/api/auth/login", input);
  return response.data.user;
}

export async function signup(input: SignupInput): Promise<CurrentUser> {
  const response = await api.post<UserResponse>("/api/auth/signup", input);
  return response.data.user;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}
