/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during build time
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Optional: Disable TypeScript type checking during build (if you have TypeScript)
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
