import { cloudinary } from '../config/cloudinary.js';
import { AppError } from '../middleware/error-handler.js';

interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 600, height: 900, crop: 'fill', quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(error?.message || 'Upload failed', 500));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function uploadPdfBuffer(
  buffer: Buffer,
  folder: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        // KEY FIX: PDFs uploaded as 'image' so Cloudinary
        // serves them with Content-Type: application/pdf
        // and keeps the .pdf extension
        resource_type: 'image',
        format: 'pdf',
        type: 'upload',
        access_mode: 'public',
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(error?.message || 'Upload failed', 500));
          return;
        }

        // Force the .pdf extension in the URL so browsers render inline
        const pdfUrl = result.secure_url.endsWith('.pdf')
          ? result.secure_url
          : `${result.secure_url}.pdf`;

        resolve({ url: pdfUrl, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}