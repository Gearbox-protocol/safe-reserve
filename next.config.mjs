/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  distDir: "out",
  basePath: "",
  assetPrefix: "",
  serverExternalPackages: ["sequelize", "pino", "pino-pretty"],
  images: {
    domains: ["static.gearbox.fi"],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.txt$/,
      use: "raw-loader",
    });
    
    // Exclude fs and path from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
