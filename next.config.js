/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, nextRuntime }) => {
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

    // Use different targets for Edge runtime
    if (nextRuntime === 'edge') {
      config.target = ['web', 'es2022'];
    } else {
      config.target = isServer ? 'node18' : ['web', 'es2020'];
    }

    // Fix edge runtime compatibility issue with module
    if (nextRuntime === 'edge') {
      // Some libraries reference 'module' which isn't available in Edge
      config.resolve.fallback = {
        ...config.resolve.fallback,
        module: false,
      };
    }

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize file tracing for Edge functions - moved from experimental to root level
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/darwin-x64',
    ],
  },
  // Ensure proper output mode for Edge functions
  output: 'standalone',
};

module.exports = nextConfig; 