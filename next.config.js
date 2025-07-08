/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configuração condicional para export estático (Capacitor)
  ...(process.env.NEXT_EXPORT === 'true' && {
    output: 'export',
  })
}

module.exports = nextConfig