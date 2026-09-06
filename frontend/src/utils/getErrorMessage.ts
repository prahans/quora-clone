import axios from "axios";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      return "Unable to connect to the server. Please try again later.";
    }
    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}
