/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração de saída
  distDir: '.next',
  
  // Configuração de imagens
  images: {
    domains: ['localhost', 'via.placeholder.com'],
    unoptimized: true,
  },
  
  // Configuração de trailing slash
  trailingSlash: false,
  
  // Configuração de compressão
  compress: true,
  
  // Configuração de powered by header
  poweredByHeader: false,
}

module.exports = nextConfig 