/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@j-entends-rien/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" }
    ]
  }
};

export default nextConfig;
