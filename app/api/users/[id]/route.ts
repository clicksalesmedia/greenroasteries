import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { hash } from 'bcrypt';
import { checkAuth } from '@/app/lib/auth';

export const runtime = 'nodejs'; // Use Node.js runtime for Prisma compatibility

// GET a single user with permissions
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    // Access id by awaiting the params promise
    const params = await context.params;
    const id = await context.params.then(p => p.id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: true,
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password from response for security
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// UPDATE a user
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    // Access id by awaiting the params promise
    const params = await context.params;
    const id = await context.params.then(p => p.id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: true,
      }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if email is already in use by another user
    if (body.email && body.email !== existingUser.email) {
      const userWithEmail = await prisma.user.findUnique({
        where: { email: body.email }
      });
      
      if (userWithEmail && userWithEmail.id !== id) {
        return NextResponse.json(
          { error: 'Email is already in use by another user' },
          { status: 400 }
        );
      }
    }
    
    // Prepare user update data
    const updateData: any = {
      name: body.name,
      email: body.email,
      role: body.role,
      isActive: body.isActive
    };
    
    // Add password to update data if provided
    if (body.password) {
      updateData.password = await hash(body.password, 10);
    }
    
    // Update user in a transaction to handle permissions
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update basic user information
      const user = await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          permissions: true,
        }
      });
      
      // Handle permissions update if provided
      if (body.permissions && Array.isArray(body.permissions)) {
        // Get existing permission IDs
        const existingPermissionIds = user.permissions.map(p => p.id);
        
        // Handle each permission item
        for (const perm of body.permissions) {
          if (perm.id && existingPermissionIds.includes(perm.id)) {
            // Update existing permission
            await tx.permission.update({
              where: { id: perm.id },
              data: {
                canView: perm.canView,
                canCreate: perm.canCreate,
                canEdit: perm.canEdit,
                canDelete: perm.canDelete,
              }
            });
          } else {
            // Create new permission
            await tx.permission.create({
              data: {
                userId: id,
                module: perm.module,
                canView: perm.canView,
                canCreate: perm.canCreate,
                canEdit: perm.canEdit,
                canDelete: perm.canDelete,
              }
            });
          }
        }
        
        // Find permissions to delete (permissions in DB but not in request)
        const permissionModulesInRequest = body.permissions.map((p: any) => p.module);
        const permissionsToDelete = user.permissions.filter(
          (p: any) => !permissionModulesInRequest.includes(p.module)
        );
        
        // Delete permissions that are no longer present
        for (const permToDelete of permissionsToDelete) {
          await tx.permission.delete({
            where: { id: permToDelete.id }
          });
        }
      }
      
      return user;
    });
    
    // Remove password from response for security
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE a user
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and permissions
    const auth = await checkAuth(['ADMIN']);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }
    
    // Access id by awaiting the params promise
    const params = await context.params;
    const id = await context.params.then(p => p.id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is attempting to delete themselves
    if (id === auth.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Delete the user (permissions will cascade delete due to relation in schema)
    await prisma.user.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 