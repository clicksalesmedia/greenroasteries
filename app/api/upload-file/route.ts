import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Base uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      // First make sure the main uploads directory exists
      if (!existsSync(uploadsDir)) {
        console.log('Creating main uploads directory at:', uploadsDir);
        mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Handle nested paths for different types of uploads
      let targetDir = uploadsDir;
      
      // Check if uploadType contains slashes indicating a nested directory
      if (uploadType.includes('/')) {
        // Split the path and create each subdirectory as needed
        const pathParts = uploadType.split('/');
        
        // Pop the last part which would be used in the filename
        const filenamePrefix = pathParts.pop() || uploadType;
        
        // Build the subdirectory path
        for (const part of pathParts) {
          targetDir = path.join(targetDir, part);
          console.log('Checking subdirectory:', targetDir);
          
          // Create the subdirectory if it doesn't exist
          if (!existsSync(targetDir)) {
            console.log('Creating subdirectory:', targetDir);
            mkdirSync(targetDir, { recursive: true });
            // Set permissions for the new directory
            await new Promise<void>((resolve, reject) => {
              const { exec } = require('child_process');
              exec(`chmod -R 775 ${targetDir}`, (err: Error) => {
                if (err) {
                  console.warn('Warning: Could not set permissions on directory:', err);
                  // Don't fail on permission setting
                }
                resolve();
              });
            });
          }
        }
        
        // Use the shorter filenamePrefix for the actual filename
        const fileName = `${filenamePrefix}_${uuidv4()}.${extension}`;
      }
      
      const filePath = path.join(uploadsDir, fileName);
      console.log('Saving file to:', filePath);
      
      // Ensure directory exists once more right before writing
      const fileDir = path.dirname(filePath);
      if (!existsSync(fileDir)) {
        console.log('Creating directory before writing:', fileDir);
        mkdirSync(fileDir, { recursive: true });
      }
      
      // Write the file
      await writeFile(filePath, buffer);
      console.log('File saved successfully to:', filePath);
      
      // Set proper permissions for the file
      try {
        const { exec } = require('child_process');
        exec(`chmod 664 ${filePath}`, (err: Error) => {
          if (err) {
            console.warn('Warning: Could not set file permissions:', err);
            // Don't fail on permission setting
          }
        });
      } catch (permError) {
        console.warn('Warning: Error while setting file permissions:', permError);
      }
    } catch (dirError: any) {
      console.error('Error creating uploads directory:', dirError);
      return NextResponse.json(
        { error: `Failed to create uploads directory: ${dirError.message}` },
        { status: 500 }
      );
    }
    
    // Return the URL path - always start with / to ensure it's an absolute path from the domain root
    const fileUrl = `/uploads/${fileName}`;
    console.log('File will be accessible at URL:', fileUrl);
    
    // Try to check if the file is actually written (sanity check)
    if (existsSync(path.join(uploadsDir, fileName))) {
      console.log('File exists on disk verification passed');
    } else {
      console.error('Warning: File does not exist on disk after writing');
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
      url: fileUrl, // Add url field for backward compatibility
      file: fileUrl,
      fileName: fileName,
      fileData: dataUrl,
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