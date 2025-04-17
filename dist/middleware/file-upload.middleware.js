"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const error_middleware_1 = require("./error.middleware");
// Storage configuration - memory storage for S3 upload
const storage = multer_1.default.memoryStorage();
// File filter - only allow image files
const fileFilter = (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
        callback(null, true);
    }
    else {
        callback(new error_middleware_1.AppError('Not an image! Please upload only images.', 400));
    }
};
// Configure multer with options
exports.fileUpload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB limit
    },
});
