import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync, statSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params in Next.js 15
    const params = await context.params;
    
    // Get the file path from the URL
    const filePath = params.path.join('/');
    
    // Construct the full file path - check both standalone and regular public directories
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'uploads', filePath),
      path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', filePath),
      path.join(process.cwd(), 'public', filePath), // Fallback for other static files
    ];
    
    let fullPath: string | null = null;
    let stats: any = null;
    
    // Find the first existing file
    for (const possiblePath of possiblePaths) {
      if (existsSync(possiblePath)) {
        fullPath = possiblePath;
        stats = statSync(possiblePath);
        break;
      }
    }
    
    if (!fullPath || !stats) {
      console.log(`Image not found in any location: ${filePath}`);
      console.log('Checked paths:', possiblePaths);
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Check if it's a file (not directory)
    if (!stats.isFile()) {
      return new NextResponse('Not a file', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = readFileSync(fullPath);
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = getContentType(ext);
    
    // Set cache-busting headers for uploaded images
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      // Disable all caching for uploaded images
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      // Add timestamp to ensure freshness
      'Last-Modified': stats.mtime.toUTCString(),
      'ETag': `"${stats.mtime.getTime()}-${stats.size}"`,
      // CORS headers if needed
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

function getContentType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Enable edge runtime for better performance
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 