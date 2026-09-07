import { CloudinaryConfigurationError } from "../config/cloudinary.ts";

export function getImageUploadFailure(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  if (error instanceof CloudinaryConfigurationError) {
    return {
      status: 503,
      code: "IMAGE_UPLOAD_NOT_CONFIGURED",
      message: "Image uploads are not configured on the server. Please contact the site owner.",
    };
  }

  const details =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : {};
  const status = details.http_code;

  if (
    status === 408 || status === 499 || status === 504 ||
    details.name === "TimeoutError" || details.code === "ETIMEDOUT"
  ) {
    return {
      status: 504,
      code: "IMAGE_UPLOAD_TIMEOUT",
      message: "Image upload timed out. Please try again.",
    };
  }

  if (status === 401) {
    return {
      status: 502,
      code: "IMAGE_UPLOAD_AUTH_FAILED",
      message: "The image service rejected the server credentials. Please contact the site owner.",
    };
  }

  if (status === 403) {
    return {
      status: 502,
      code: "IMAGE_UPLOAD_FORBIDDEN",
      message: "The image service does not allow this upload. Please contact the site owner.",
    };
  }

  if (status === 400) {
    return {
      status: 502,
      code: "IMAGE_UPLOAD_REJECTED",
      message: "The image service rejected this upload. Try another image or contact the site owner.",
    };
  }

  if (status === 420 || status === 429) {
    return {
      status: 503,
      code: "IMAGE_UPLOAD_RATE_LIMITED",
      message: "The image service is busy. Please try again later.",
    };
  }

  const connectionErrors = [
    "ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN",
    "ENETUNREACH", "EHOSTUNREACH", "EACCES", "EPIPE",
  ];
  if (typeof details.code === "string" && connectionErrors.includes(details.code)) {
    return {
      status: 503,
      code: "IMAGE_UPLOAD_CONNECTION_FAILED",
      message: "The server could not connect to the image service. Please try again later.",
    };
  }

  return {
    status: 502,
    code: "IMAGE_UPLOAD_FAILED",
    message: "The image service failed to upload your image. Please contact the site owner.",
  };
}
