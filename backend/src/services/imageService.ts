import cloudinary, { validateCloudinaryConfig } from "../config/cloudinary.ts";

export async function deleteImage(publicId: string) {
  validateCloudinaryConfig();

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  // A retry can reach an image that was already removed successfully.
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Image deletion failed");
  }
}

export function uploadImage(buffer: Buffer) {
  return new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    validateCloudinaryConfig();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "quora/posts",
        resource_type: "image",
      },

      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Image upload failed"));
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });
}
