import multer from "multer";
import type { RequestHandler } from "express";

class UnsupportedImageTypeError extends Error {}

const storage = multer.memoryStorage();

export const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new UnsupportedImageTypeError("Only JPG, PNG and WEBP images are allowed"),
      );
    }

    callback(null, true);
  },
});

const parseImage = upload.single("image");

export const uploadPostImage: RequestHandler = (req, res, next) => {
  parseImage(req, res, (error: unknown) => {
    if (error instanceof UnsupportedImageTypeError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    if (error instanceof multer.MulterError) {
      const isTooLarge = error.code === "LIMIT_FILE_SIZE";
      res.status(isTooLarge ? 413 : 400).json({
        success: false,
        message: isTooLarge
          ? "Image must be 5 MB or smaller"
          : "Please upload a single image in the image field",
      });
      return;
    }

    next(error);
  });
};
