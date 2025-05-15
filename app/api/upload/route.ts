import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 5MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Create unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get file extension
    const originalName = file.name;
    const extension = originalName.split('.').pop() || '';
    
    // Create unique filename with UUID
    const fileName = `${uuidv4()}.${extension}`;
    
    // Create directory path
    const publicDir = join(process.cwd(), 'public');
    const uploadDir = join(publicDir, folder);
    
    // Ensure directory exists
    try {
      await writeFile(join(uploadDir, fileName), buffer);
    } catch (error) {
      console.error('Error saving file:', error);
      
      // If directory doesn't exist, create it
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const fs = require('fs');
        fs.mkdirSync(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, fileName), buffer);
      } else {
        throw error;
      }
    }
    
    // Return the URL to the uploaded file
    const fileUrl = `/${folder}/${fileName}`;
    
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Increase the limit for the request body
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 