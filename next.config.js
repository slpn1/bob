/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DALL_E_3_ENDPOINT: process.env.DALL_E_3_ENDPOINT,
    DALL_E_3_API_KEY: process.env.DALL_E_3_API_KEY,
  },
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
};

module.exports = nextConfig; 