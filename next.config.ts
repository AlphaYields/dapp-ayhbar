import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'pino-pretty': false,
        '@react-native-async-storage/async-storage': false,
      };
    } else {
      config.externals.push({
        'pino-pretty': 'pino-pretty',
        '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage',
      });
    }

    return config;
  },

  images: {
    remotePatterns: [],
    unoptimized: false,
  },
};

export default nextConfig;
