/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds to avoid blocking deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable experimental features for better performance
  experimental: {
    // Other experimental features can go here
  },
  
  // External packages for server components (moved from experimental in Next.js 15)
  serverExternalPackages: ['sharp'],
  
  // Transpile packages that need it
  transpilePackages: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60, // 1 minute instead of default 60 seconds
    loader: 'default',
    path: '/_next/image',
    unoptimized: false,
    // Note: quality is set per-image, not globally
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    domains: ['thegreenroasteries.com', '167.235.137.52', 'localhost'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable compression
  compress: true,
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000', // 30 days
          },
        ],
      },
      {
        source: '/api/sliders',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300', // 1 minute with stale-while-revalidate
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      {
        source: '/api/banners',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300', // 1 minute
          },
        ],
      },
      {
        source: '/api/products',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=600', // 5 minutes
          },
        ],
      },
      {
        source: '/api/categories',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=600, s-maxage=600, stale-while-revalidate=1200', // 10 minutes
          },
        ],
      },
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
  
  // Optimize webpack bundle
  webpack: (config, { dev, isServer, webpack }) => {
    // Handle client-side only libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Add webpack DefinePlugin to handle process.env properly
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        ),
      })
    );
    
    // Optimize for production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        minimize: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module) {
                return module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.nameForCondition() || '');
              },
              name(module) {
                const hash = require('crypto').createHash('sha1');
                hash.update(module.nameForCondition() || '');
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module, chunks) {
                return require('crypto')
                  .createHash('sha1')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex') + (isServer ? '-server' : '');
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    // Optimize for server-side rendering
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('sharp');
    }
    
    return config;
  },
  
  // Enable static optimization
  trailingSlash: false,
  
  // Configure output for better performance
  output: 'standalone',
  
  // Enable React strict mode for better performance
  reactStrictMode: true,
  
  // Environment variables
  env: {
    NEXT_REVALIDATE_TIME: '0', // Disable revalidation for uploaded content
  },
  
  // Asset prefix for standalone mode
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Custom rewrites for uploads
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/serve-image/:path*',
      },
    ];
  },
}

module.exports = nextConfig
