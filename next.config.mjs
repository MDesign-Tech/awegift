/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Cloudflare Pages configuration - remove static export since we have API routes
  trailingSlash: false,
  skipTrailingSlashRedirect: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  // Cloudflare Pages optimization
  poweredByHeader: false,

  // External packages for server components (Next.js 15+)
  serverExternalPackages: ["firebase-admin"],

  compress: true,
  productionBrowserSourceMaps: false,

  // Ignore Windows system folders
  watchOptions: {
    ignored: ['**/node_modules', '**/System Volume Information'],
  },
};

export default nextConfig;
