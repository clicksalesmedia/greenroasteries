const fs = require('fs');
const path = require('path');

// Function to ensure the uploads directory exists
const ensureUploadsDir = () => {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  console.log('Checking if uploads directory exists:', uploadsDir);
  
  if (!fs.existsSync(uploadsDir)) {
    try {
      console.log('Creating uploads directory...');
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Uploads directory created successfully.');
    } catch (error) {
      console.error('Error creating uploads directory:', error);
      return false;
    }
  } else {
    console.log('Uploads directory already exists.');
  }
  
  // Check if directory is writable
  try {
    console.log('Testing if uploads directory is writable...');
    const testFile = path.join(uploadsDir, 'test-write.txt');
    fs.writeFileSync(testFile, 'Test file for write permissions', 'utf8');
    console.log('Successfully wrote test file.');
    
    // Clean up the test file
    fs.unlinkSync(testFile);
    console.log('Successfully removed test file.');
    
    return true;
  } catch (error) {
    console.error('Error testing write permissions:', error);
    return false;
  }
};

// Run the test
const result = ensureUploadsDir();
console.log('Result:', result ? '✅ Uploads directory is ready' : '❌ There was a problem with the uploads directory'); 