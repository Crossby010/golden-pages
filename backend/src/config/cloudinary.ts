import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export async function testCloudinaryConnection(): Promise<void> {
  try {
    await cloudinary.api.ping();
    console.log('✅ Cloudinary connected');
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
    throw error;
  }
}