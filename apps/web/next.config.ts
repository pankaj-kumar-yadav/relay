import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
   output: 'standalone',
   outputFileTracingRoot: path.join(__dirname, '../..'),
   devIndicators: false,
   transpilePackages: ['emoji-picker-react'],
};

export default nextConfig;
