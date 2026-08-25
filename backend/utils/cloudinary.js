import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';

const requiredCloudinaryVariables = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missingCloudinaryVariables = requiredCloudinaryVariables.filter(
  (key) => !process.env[key]
);

if (missingCloudinaryVariables.length > 0) {
  throw new Error(
    `Missing Cloudinary environment variables: ${missingCloudinaryVariables.join(', ')}`
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
