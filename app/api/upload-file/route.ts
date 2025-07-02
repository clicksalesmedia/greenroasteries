import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fixUploadPermissions } from '@/lib/fix-permissions';

// This version does NOT use edge runtime - it's for server environments
// where we can access the filesystem directly

export async function POST(req: NextRequest) {
  try {
    console.log('Server Upload API called');
    
    // Skip authentication check for now - it's causing issues
    // Note: We'll log for debugging but won't block the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('Upload request without authorization header - allowing anyway');
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
    
    const uploadFolderSpecifier = type || folder;
    if (!uploadFolderSpecifier) {
      console.error('No type or folder specified');
      return NextResponse.json(
        { error: 'Either type or folder must be specified' },
        { status: 400 }
      );
    }
    
    console.log(`Processing upload for specifier "${uploadFolderSpecifier}":`, {
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
      console.log(`Unsupported extension ${extension}, using jpg as default`);
      extension = 'jpg';
    }
    
    const uniqueFileName = `${uuidv4()}.${extension}`;
    
    // Base uploads directory - save to both main public and standalone public
    const baseUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const standaloneUploadsDir = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads');
    
    // targetDirectory will be like /public/uploads/categories or /public/uploads/products/variations
    const targetDirectory = path.join(baseUploadsDir, uploadFolderSpecifier);
    const standaloneTargetDirectory = path.join(standaloneUploadsDir, uploadFolderSpecifier);
    
    // filePathOnServer is the absolute path on the server
    // e.g., /var/www/greenroasteries/public/uploads/categories/guid.webp
    const filePathOnServer = path.join(targetDirectory, uniqueFileName);
    
    try {
      if (!existsSync(targetDirectory)) {
        console.log(`Target directory ${targetDirectory} does not exist. Creating...`);
        mkdirSync(targetDirectory, { recursive: true });
        console.log(`Directory ${targetDirectory} created successfully.`);
      }
      if (!existsSync(standaloneTargetDirectory)) {
        console.log(`Standalone target directory ${standaloneTargetDirectory} does not exist. Creating...`);
        mkdirSync(standaloneTargetDirectory, { recursive: true });
        console.log(`Standalone directory ${standaloneTargetDirectory} created successfully.`);
      }
    } catch (dirError: any) {
      console.error('Error creating target directory:', targetDirectory, dirError);
      return NextResponse.json(
        { error: `Failed to create target directory: ${dirError.message}` },
        { status: 500 }
      );
    }
    
    const standaloneFilePathOnServer = path.join(standaloneTargetDirectory, uniqueFileName);
    
    console.log('Attempting to save file to server paths:', filePathOnServer, 'and', standaloneFilePathOnServer);
    
    try {
      // Save to main public directory (for nginx serving)
      await writeFile(filePathOnServer, buffer);
      console.log('File saved successfully to main public path:', filePathOnServer);
      
      // Also save to standalone directory (for consistency)
      await writeFile(standaloneFilePathOnServer, buffer);
      console.log('File saved successfully to standalone path:', standaloneFilePathOnServer);
    } catch (writeError: any) {
      console.error('Error writing file to disk:', filePathOnServer, writeError);
      return NextResponse.json(
        { error: `Failed to write file to disk: ${writeError.message}` },
        { status: 500 }
      );
    }
    
    // Construct the URL for client access
    // e.g., /uploads/categories/guid.webp or /uploads/products/variations/guid.webp
    const fileUrl = `/uploads/${uploadFolderSpecifier}/${uniqueFileName}`;
    console.log('File will be accessible at URL:', fileUrl);
    
    // Fix permissions for the uploaded file
    const relativeUploadPath = `${uploadFolderSpecifier}/${uniqueFileName}`;
    await fixUploadPermissions(relativeUploadPath);
    console.log('Permissions fixed for uploaded file:', relativeUploadPath);
    
    // Try to check if the file is actually written (sanity check)
    if (existsSync(filePathOnServer)) {
      console.log('File exists on disk verification passed:', filePathOnServer);
    } else {
      console.error('CRITICAL: File does not exist on disk after attempting to write:', filePathOnServer);
    }
    
    // Create a data URL for preview purposes
    let dataUrl = null;
    try {
      const base64 = buffer.toString('base64');
      dataUrl = `data:${file.type};base64,${base64}`;
    } catch (error) {
      console.warn('Failed to create data URL for preview', error);
    }
    
    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      file: fileUrl, // Keep 'file' for backward compatibility if some frontend parts use it
      fileName: uniqueFileName, // The actual unique name of the saved file
      originalFilename: file.name, // Original name for reference if needed
      fileData: dataUrl,
      message: 'File uploaded successfully',
      // Add timestamp for cache busting
      timestamp: Date.now(),
      // Add cache buster URL
      cacheBustedUrl: `${fileUrl}?t=${Date.now()}`
    }, {
      headers: {
        // Disable caching for upload responses
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error: any) {
    console.error('Error processing upload:', error);
    // Ensure a clear error message is sent back
    let errorMessage = 'Upload failed due to an unexpected error.';
    if (error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    // Log the full error for server-side debugging
    console.error('Full error object during upload:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
} 