/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (!dev) return config;

    config.watchOptions = {
      ...config.watchOptions,
      poll: 1000,
      aggregateTimeout: 300
    };

    return config;
  }
};

export default nextConfig;
