/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    // Increase memory limit
    config.performance = {
      ...config.performance,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
      hints: false,
    };
    
    // Optimize cache settings
    config.cache = {
      ...config.cache,
      type: 'filesystem',
      maxAge: 31536000000, // 1 year
      buildDependencies: {
        config: [__filename],
      },
    };
    
    // Add environment variable to enable Node.js options
    if (isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: !dev,
      };
    }
    
    return config;
  },
  images: {
    domains: ['images.unsplash.com'],
  },
}

module.exports = nextConfig 