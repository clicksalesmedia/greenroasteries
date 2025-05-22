import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Fix permissions for an uploaded file
 * @param filePath Relative path within uploads directory (e.g. "products/variations/file.jpg")
 * @returns Promise that resolves when permissions are fixed or rejects on error
 */
export async function fixUploadPermissions(filePath?: string): Promise<void> {
  try {
    // Determine if we're in production (server) or development
    const isProd = process.env.NODE_ENV === 'production';
    
    if (!isProd) {
      console.log('Not in production, skipping permission fix');
      return;
    }
    
    // Path to the fix-permissions script on the server
    const scriptPath = path.join(process.cwd(), 'scripts', 'fix-upload-permissions.sh');
    
    // Build the command
    let command = `bash ${scriptPath}`;
    if (filePath) {
      command += ` "${filePath}"`;
    }
    
    // Execute the script
    console.log(`Executing permission fix: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) console.log('Permission fix output:', stdout);
    if (stderr) console.error('Permission fix error:', stderr);
    
  } catch (error) {
    console.error('Failed to fix permissions:', error);
    // Don't throw error, as this shouldn't block the upload process
    // Just log the issue
  }
} 