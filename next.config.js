/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['example.com', 'localhost', 'res.cloudinary.com', 'images.unsplash.com'],
    unoptimized: true,
  },
};

module.exports = nextConfig; 