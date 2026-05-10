/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '*.reuters.com' },
      { protocol: 'https', hostname: '*.bbc.co.uk' },
      { protocol: 'https', hostname: '*.bbc.com' },
      { protocol: 'https', hostname: '*.theguardian.com' },
      { protocol: 'https', hostname: '*.foxnews.com' },
      { protocol: 'https', hostname: '*.apnews.com' },
      { protocol: 'https', hostname: '*.npr.org' },
      { protocol: 'https', hostname: '*.wsj.com' },
      { protocol: 'https', hostname: '*.axios.com' },
    ],
  },
};

export default nextConfig;
