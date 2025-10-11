import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Using a Promise to wrap the upload_stream
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        // Optional options, such as the folder to save in
        folder: 'token_images', 
      }, (error, result) => {
        if (error) {
          console.error("Error uploading to Cloudinary:", error);
          reject(error);
        }
        // 'result' can be undefined in case of an error, but 'error' would be thrown first
        resolve(result!);
      }).end(buffer);
    });

    return NextResponse.json({ secure_url: result.secure_url });

  } catch (error) {
    console.error("Error in /api/upload-image endpoint:", error);
    // Returning a more generic error message to the client
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
