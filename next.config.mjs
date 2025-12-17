/** @type {import('next').NextConfig} */
const nextConfig = {
  // Speed up development
  reactStrictMode: false, // Disable double-rendering in dev

  // Reduce bundle analysis overhead
  productionBrowserSourceMaps: false,
};

export default nextConfig;
