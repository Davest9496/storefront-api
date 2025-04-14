import multer from 'multer';
import { Request } from 'express';
import { AppError } from './error.middleware';

// Storage configuration - memory storage for S3 upload
const storage = multer.memoryStorage();

// File filter - only allow image files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  } else {
    callback(new AppError('Not an image! Please upload only images.', 400) as unknown as Error);
  }
};

// Configure multer with options
export const fileUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB limit
  },
});
