const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env files
function loadEnvVariables() {
  const envFiles = ['.env.local', '.env'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^([^#\s][^=]*?)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

// Load environment variables
loadEnvVariables();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function checkCloudinaryConfig() {
  console.log('🔍 Checking Cloudinary Configuration...\n');
  
  console.log('Environment Variables:');
  console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET'}`);
  console.log(`API Key: ${process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'}\n`);
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log('❌ Missing Cloudinary credentials!\n');
    console.log('📋 To get your Cloudinary credentials:');
    console.log('1. Go to https://console.cloudinary.com/');
    console.log('2. Sign in or create an account');
    console.log('3. Go to Dashboard');
    console.log('4. Copy your credentials from the "API Keys" section');
    console.log('5. Add them to your .env file:\n');
    console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('CLOUDINARY_API_KEY=your_api_key');
    console.log('CLOUDINARY_API_SECRET=your_api_secret\n');
    return false;
  }
  
  try {
    console.log('🔗 Testing Cloudinary connection...');
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful!');
    console.log('📊 Account info:', result);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  checkCloudinaryConfig()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Ready to migrate images to Cloudinary!');
        console.log('Run: node scripts/migrate-all-images-to-cloudinary.js');
      } else {
        console.log('\n⚠️  Please configure Cloudinary credentials first.');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { checkCloudinaryConfig }; 