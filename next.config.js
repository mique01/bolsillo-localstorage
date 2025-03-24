/** @type {import('next').NextConfig} */

// Determinar si estamos construyendo para GitHub Pages o Vercel
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const isVercel = process.env.VERCEL === '1';

// Configuración específica para GitHub Pages
const githubPagesConfig = {
  output: 'export', // Generar archivos estáticos
  images: {
    unoptimized: true, // No optimizar imágenes para evitar problemas con rutas
  },
  trailingSlash: true, // Añadir barras al final para compatibilidad con GitHub Pages
  assetPrefix: process.env.NODE_ENV === 'production' ? '/bolsilloapp-localstorage' : '', // Ajustar según el nombre de tu repo
  basePath: process.env.NODE_ENV === 'production' ? '/bolsilloapp-localstorage' : '',
  distDir: 'out', // Directorio de salida para la compilación
};

// Configuración estándar para Vercel o desarrollo local
const standardConfig = {
  // Opciones estándar
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

// Aplicar la configuración correcta según el entorno
const nextConfig = isGitHubPages
  ? { ...standardConfig, ...githubPagesConfig }
  : { ...standardConfig, output: 'export' };

// Configuración de webpack para ambos entornos
nextConfig.webpack = (config, { isServer }) => {
  if (!isServer) {
    // Polyfills para browser APIs no disponibles en Node
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      zlib: require.resolve('browserify-zlib'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      assert: require.resolve('assert'),
      os: require.resolve('os-browserify/browser'),
      buffer: require.resolve('buffer/'),
      util: require.resolve('util/'),
    };
    
    // Add buffer polyfill
    config.plugins.push(
      new (require('webpack')).ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );
  }
  
  // Incrementar el tamaño de chunk para evitar errores de compilación
  config.performance = {
    ...config.performance,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  };
  
  return config;
};

// Ajustar headers para todos los entornos
nextConfig.headers = async () => {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'X-Requested-With, Content-Type, Authorization',
        },
      ],
    },
  ];
};

// Manejo de errores en tiempo de construcción
nextConfig.onDemandEntries = {
  maxInactiveAge: 25 * 1000,
  pagesBufferLength: 5,
};

module.exports = nextConfig; 