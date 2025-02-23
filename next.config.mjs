/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sequelize", "pino", "pino-pretty"],
  },
  images: {
    domains: ["static.gearbox.fi"],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.txt$/,
      use: "raw-loader",
    });
    return config;
  },
};

export default nextConfig;
