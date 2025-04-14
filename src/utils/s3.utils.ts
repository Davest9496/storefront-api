import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

// Singleton S3 client
let s3Client: S3Client | null = null;

/**
 * Get S3 client instance
 */
export const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  return s3Client;
};

/**
 * Get S3 bucket name
 */
export const getS3BucketName = (): string => {
  return process.env.S3_BUCKET || 'storefront-images-058264347310';
};

/**
 * Upload file to S3
 */
export const uploadToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folder = 'products',
): Promise<string> => {
  try {
    const client = getS3Client();
    const bucketName = getS3BucketName();

    // Create unique file path in S3
    const key = `${folder}/${fileName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    await client.send(command);

    // Return the URL of the uploaded image
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  } catch (error) {
    logger.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    const client = getS3Client();
    const bucketName = getS3BucketName();

    // Extract key from URL
    const urlParts = fileUrl.split(`${bucketName}.s3.amazonaws.com/`);
    if (urlParts.length !== 2) {
      throw new Error('Invalid S3 URL format');
    }

    const key = urlParts[1];

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    logger.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Generate unique filename for S3
 */
export const generateS3FileName = (originalName: string): string => {
  const extension = originalName.split('.').pop() || 'jpg';
  return `${uuidv4()}.${extension}`;
};
