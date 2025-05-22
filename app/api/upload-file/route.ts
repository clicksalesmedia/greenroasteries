import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// This version does NOT use edge runtime - it's for server environments
// where we can access the filesystem directly

export async function POST(req: NextRequest) {
  try {
    console.log('Server Upload API called');
    
    // Basic authentication check
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        console.error('Unauthorized upload attempt');
        return NextResponse.json(
          { error: 'Unauthorized. Authentication required.' },
          { status: 401 }
        );
      }
    }
    
    // Process the form data
    const formData = await req.formData();
    console.log('FormData received');
    
    const file = formData.get('file') as File;
    if (!file) {
      console.error('No file received in upload request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Get type or folder parameter
    const type = formData.get('type') as string;
    const folder = formData.get('folder') as string;
    
    // Validate that we have either a type or folder
    if (!type && !folder) {
      console.error('No type or folder specified');
      return NextResponse.json(
        { error: 'Either type or folder must be specified' },
        { status: 400 }
      );
    }
    
    // Use type or folder for the file path
    const uploadType = type || folder;
    
    console.log(`Processing ${uploadType} image upload:`, {
      filename: file.name,
      type: file.type,
      size: file.size
    });
    
    // Check file type - only accept jpg, png, webp, avif
    const validImageTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp',
      'image/avif'
    ];
    
    const isImageMimeType = validImageTypes.includes(file.type);
    const hasImageExtension = /\.(jpg|jpeg|png|webp|avif)$/i.test(file.name);
    
    if (!isImageMimeType && !hasImageExtension) {
      console.error('Invalid file type:', file.type, file.name);
      return NextResponse.json(
        { error: 'File must be an image (jpg, png, webp, or avif)' },
        { status: 400 }
      );
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large:', file.size);
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }
    
    // Create a buffer from the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create unique filename with original extension - ensuring we have a valid extension
    let extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Validate extension and convert if necessary
    if (!['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension)) {
      console.log(`Unsupported extension ${extension}, converting to jpg for better compatibility`);
      extension = 'jpg';
    }
    
    const fileName = `${uploadType}_${uuidv4()}.${extension}`;
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      console.log('Creating uploads directory at:', uploadsDir);
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Write the file
    const filePath = path.join(uploadsDir, fileName);
    console.log('Saving file to:', filePath);
    await writeFile(filePath, buffer);
    console.log('File saved successfully');
    
    // Return the URL path
    const fileUrl = `/uploads/${fileName}`;
    console.log('File will be accessible at URL:', fileUrl);
    
    return NextResponse.json({ 
      success: true, 
      url: fileUrl, // Add url field for backward compatibility
      file: fileUrl,
      message: 'File uploaded successfully'
    });
    
  } catch (error: any) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
} 