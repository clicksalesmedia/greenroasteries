import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prisma';

// GET /api/content/[type] - Get content for a specific page type
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const type = await context.params.then(p => p.type.toUpperCase());
    
    // Validate the page type
    if (!['PRIVACY_POLICY', 'REFUND_POLICY', 'TERMS_CONDITIONS', 'ABOUT_US'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid page type' },
        { status: 400 }
      );
    }
    
    // Find the page content in the database
    const pageContent = await prisma.pageContent.findUnique({
      where: { pageType: type as any },
    });
    
    // If no content exists yet, return a default structure
    if (!pageContent) {
      return NextResponse.json({
        id: null,
        pageType: type,
        title: '',
        titleAr: '',
        content: '',
        contentAr: '',
        lastUpdated: new Date().toISOString(),
        metadata: {},
      });
    }
    
    // Ensure metadata is properly handled (convert from any if needed)
    const metadata = pageContent.metadata || {};
    console.log('Metadata retrieved:', metadata);
    
    return NextResponse.json({
      ...pageContent,
      metadata
    });
  } catch (error) {
    console.error('Error fetching page content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page content' },
      { status: 500 }
    );
  }
}

// PUT /api/content/[type] - Update content for a specific page type
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    // Optional authentication - try to get session but don't fail if not configured
    let session;
    try {
      session = await getServerSession();
    } catch (authError) {
      console.log('Auth not configured or error getting session:', authError);
      // Continue without authentication for development
    }
    
    // In production, you would want to check authentication
    // Commenting out for easier development:
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const type = await context.params.then(p => p.type.toUpperCase());
    console.log('Content update request for type:', type);
    
    // Validate the page type
    if (!['PRIVACY_POLICY', 'REFUND_POLICY', 'TERMS_CONDITIONS', 'ABOUT_US'].includes(type)) {
      console.error('Invalid page type:', type);
      return NextResponse.json(
        { error: 'Invalid page type' },
        { status: 400 }
      );
    }
    
    // Safely parse the request body
    let data;
    try {
      const text = await request.text();
      console.log('Raw request body:', text);
      data = JSON.parse(text);
    } catch (parseError: any) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: `Invalid JSON in request body: ${parseError.message}` },
        { status: 400 }
      );
    }
    
    console.log('Received data for content update:', {
      type,
      title: data.title,
      hasContent: !!data.content,
      contentLength: data.content?.length || 0,
      metadata: data.metadata
    });
    
    // Validate required fields
    if (!data.title || !data.content) {
      console.error('Missing required fields:', { 
        hasTitle: !!data.title, 
        hasContent: !!data.content 
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Ensure metadata is a valid object
    const metadata = data.metadata || {};
    
    // Log metadata content to help with debugging
    console.log('Metadata being saved:', JSON.stringify(metadata, null, 2));
    
    // Check if page content exists
    const existingContent = await prisma.pageContent.findUnique({
      where: { pageType: type as any },
    });
    
    console.log('Existing content found:', !!existingContent);
    
    let pageContent;
    
    try {
      if (existingContent) {
        // Update existing page content
        pageContent = await prisma.pageContent.update({
          where: { id: existingContent.id },
          data: {
            title: data.title,
            titleAr: data.titleAr || null,
            content: data.content,
            contentAr: data.contentAr || null,
            lastUpdated: new Date(),
            metadata: metadata
          },
        });
        console.log('Updated existing content with ID:', pageContent.id);
      } else {
        // Create new page content
        pageContent = await prisma.pageContent.create({
          data: {
            pageType: type as any,
            title: data.title,
            titleAr: data.titleAr || null,
            content: data.content,
            contentAr: data.contentAr || null,
            lastUpdated: new Date(),
            metadata: metadata
          },
        });
        console.log('Created new content with ID:', pageContent.id);
      }
      
      return NextResponse.json({
        ...pageContent,
        metadata: pageContent.metadata
      });
    } catch (dbError: any) {
      console.error('Database error during content update:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating page content:', error);
    return NextResponse.json(
      { error: `Failed to update page content: ${error.message}` },
      { status: 500 }
    );
  }
} 