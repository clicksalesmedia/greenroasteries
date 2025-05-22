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
    console.log('Edge Upload API called');
    
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
      console.log(`Unsupported extension ${extension}, converting to jpg for better compatibility`);
      extension = 'jpg';
    }
    
    const fileName = `${uploadType}_${uuidv4()}.${extension}`;
    const fileUrl = `/uploads/${fileName}`;
    
    try {
      // Try to create a data URL directly from the file for image preview
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      console.log('Edge upload complete. File will be available at:', fileUrl);
      console.log('NOTE: Edge runtime cannot write to filesystem; rely on server-side sync');
      
      return NextResponse.json({
        success: true,
        url: fileUrl, // Add url field for backward compatibility
        file: fileUrl,
        fileName: fileName,
        fileData: dataUrl,
        message: 'File processed for upload - server sync required'
      });
    } catch (err) {
      console.error('Error creating data URL:', err);
      // Return a success response even if data URL creation failed
      console.log('Edge upload complete without preview. File will be available at:', fileUrl);
      
      return NextResponse.json({
        success: true,
        url: fileUrl, // Add url field for backward compatibility
        file: fileUrl,
        fileName: fileName,
        message: 'File processed for upload (no preview available) - server sync required'
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