/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DALL_E_3_ENDPOINT: process.env.DALL_E_3_ENDPOINT,
    DALL_E_3_API_KEY: process.env.DALL_E_3_API_KEY,
  },
};

module.exports = nextConfig; 