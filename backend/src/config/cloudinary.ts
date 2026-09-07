import { v2 as cloudinary } from "cloudinary";

export class CloudinaryConfigurationError extends Error {}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function validateCloudinaryConfig() {
  const config = cloudinary.config();
  const settings = {
    CLOUDINARY_CLOUD_NAME: config.cloud_name,
    CLOUDINARY_API_KEY: config.api_key,
    CLOUDINARY_API_SECRET: config.api_secret,
  };
  const missing = Object.entries(settings)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new CloudinaryConfigurationError(
      `Cloudinary configuration missing: ${missing.join(", ")}. Set these environment variables on the backend service and restart it.`,
    );
  }
}

export default cloudinary;
