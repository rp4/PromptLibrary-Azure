/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve Node.js built-in modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        stream: false,
        constants: false,
        assert: false,
        util: false,
        http: false,
        https: false,
        zlib: false,
        querystring: false,
        buffer: false,
        child_process: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig 