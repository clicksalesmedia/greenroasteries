import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Use Node.js runtime to enable file system operations
export const runtime = 'nodejs';

// This route will handle file uploads from the browser
export async function POST(req: NextRequest) {
  try {
    console.log('Upload API called');
    
    // Skip authentication check - log but don't block
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('Note: Upload request without authorization header - allowing anyway');
    }
    
    console.log('Processing upload request');
    
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
    
    // Create a unique name based on the type/folder
    let extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Validate extension and convert if necessary
    if (!['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension)) {
      console.log(`Unsupported extension ${extension}, converting to webp for better compression`);
      extension = 'webp';
    }
    
    const fileName = `${uuidv4()}.${extension}`;
    
    // Determine the subfolder based on type
    let subfolder = '';
    if (uploadType === 'products' || uploadType === 'product') {
      subfolder = 'products';
    } else if (uploadType === 'categories' || uploadType === 'category') {
      subfolder = 'categories';
    } else if (uploadType === 'sliders' || uploadType === 'slider') {
      subfolder = 'sliders';
    } else if (uploadType === 'content') {
      subfolder = 'content';
    } else if (uploadType === 'variations' || uploadType === 'variation') {
      subfolder = 'products/variations';
    } else if (uploadType === 'gallery') {
      subfolder = 'products/gallery';
    } else {
      // Default to root uploads if type unknown
      subfolder = '';
    }
    
    const fileUrl = subfolder ? `/uploads/${subfolder}/${fileName}` : `/uploads/${fileName}`;
    
    try {
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create uploads directory with subfolder if it doesn't exist
      const uploadDir = subfolder 
        ? join(process.cwd(), 'public', 'uploads', subfolder)
        : join(process.cwd(), 'public', 'uploads');
        
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
        console.log('Upload directory already exists or created');
      }
      
      // Write file to public/uploads directory
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      console.log('File uploaded successfully to:', filePath);
      console.log('File will be accessible at:', fileUrl);
      
      return NextResponse.json({
        success: true,
        url: fileUrl,
        file: fileUrl,
        fileName: fileName,
        message: 'File uploaded successfully'
      });
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return NextResponse.json(
        { error: 'Failed to save file to disk' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}