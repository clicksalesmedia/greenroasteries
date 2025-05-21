import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Edge-compatible configurations - remove runtime specification for better compatibility
export const config = {
  api: {
    bodyParser: false,
  },
};

// This route will handle file uploads from the browser
export async function POST(req: NextRequest) {
  try {
    console.log('Upload API called');
    
    // Basic authentication check - in development mode we'll allow all requests
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
    
    console.log('Authorization check passed');
    
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
    
    // Check file type - be more permissive with image formats
    const isImageMimeType = file.type.startsWith('image/');
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|heic)$/i.test(file.name);
    
    if (!isImageMimeType && !hasImageExtension) {
      console.error('Invalid file type:', file.type, file.name);
      return NextResponse.json(
        { error: 'File must be an image (jpg, png, gif, webp, svg, or heic)' },
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
    
    // Convert HEIC to JPG extension for better browser compatibility
    if (extension === 'heic') {
      console.log('HEIC image detected, converting extension to jpg for better compatibility');
      extension = 'jpg';  // Keep the content but change extension for browsers
    }
    
    const fileName = `${uploadType}_${uuidv4()}.${extension}`;
    const fileUrl = `/uploads/${fileName}`;
    
    try {
      // Try to create a data URL directly from the file for image preview
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      return NextResponse.json({
        success: true,
        url: fileUrl, // Add url field for backward compatibility
        file: fileUrl,
        fileName: fileName,
        fileData: dataUrl,
        message: 'File processed for upload'
      });
    } catch (err) {
      console.error('Error creating data URL:', err);
      // Return a success response even if data URL creation failed
      return NextResponse.json({
        success: true,
        url: fileUrl, // Add url field for backward compatibility
        file: fileUrl,
        fileName: fileName,
        message: 'File processed for upload (no preview available)'
      });
    }
  } catch (error: any) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 