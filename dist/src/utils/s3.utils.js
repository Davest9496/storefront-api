"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateS3FileName = exports.deleteFromS3 = exports.uploadToS3 = exports.getS3BucketName = exports.getS3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("./logger"));
// Singleton S3 client
let s3Client = null;
/**
 * Get S3 client instance
 */
const getS3Client = () => {
    if (!s3Client) {
        s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'eu-west-2',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }
    return s3Client;
};
exports.getS3Client = getS3Client;
/**
 * Get S3 bucket name
 */
const getS3BucketName = () => {
    return process.env.S3_BUCKET || 'storefront-images-058264347310';
};
exports.getS3BucketName = getS3BucketName;
/**
 * Upload file to S3
 */
const uploadToS3 = async (fileBuffer, fileName, mimeType, folder = 'products') => {
    try {
        const client = (0, exports.getS3Client)();
        const bucketName = (0, exports.getS3BucketName)();
        // Create unique file path in S3
        const key = `${folder}/${fileName}`;
        // Upload to S3
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: 'public-read',
        });
        await client.send(command);
        // Return the URL of the uploaded image
        return `https://${bucketName}.s3.amazonaws.com/${key}`;
    }
    catch (error) {
        logger_1.default.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
};
exports.uploadToS3 = uploadToS3;
/**
 * Delete file from S3
 */
const deleteFromS3 = async (fileUrl) => {
    try {
        const client = (0, exports.getS3Client)();
        const bucketName = (0, exports.getS3BucketName)();
        // Extract key from URL
        const urlParts = fileUrl.split(`${bucketName}.s3.amazonaws.com/`);
        if (urlParts.length !== 2) {
            throw new Error('Invalid S3 URL format');
        }
        const key = urlParts[1];
        // Delete from S3
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        await client.send(command);
    }
    catch (error) {
        logger_1.default.error('Error deleting from S3:', error);
        throw new Error('Failed to delete file from S3');
    }
};
exports.deleteFromS3 = deleteFromS3;
/**
 * Generate unique filename for S3
 */
const generateS3FileName = (originalName) => {
    const extension = originalName.split('.').pop() || 'jpg';
    return `${(0, uuid_1.v4)()}.${extension}`;
};
exports.generateS3FileName = generateS3FileName;
