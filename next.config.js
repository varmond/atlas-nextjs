/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find(
      (rule) => rule.test?.test?.('.svg'),
    )

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.node$/,
        loader: 'node-loader',
      },
    )

    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer']
  }
}

module.exports = nextConfig 