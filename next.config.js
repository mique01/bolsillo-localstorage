/** @type {import('next').NextConfig} */

// Determinar si estamos construyendo para GitHub Pages o Vercel
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';

// Nombre del repositorio para GitHub Pages
const repoName = 'bolsilloapp-localstorage';

// Determinar si debemos usar 'export' (para GitHub Pages) o 'standalone' (para Vercel)
const outputMode = isGitHubPages ? 'export' : undefined;

// Configuración común para producción
const productionConfig = {
  // Configuración común para todos los entornos de producción
  reactStrictMode: false,
  swcMinify: true,
};

// Configuración específica para GitHub Pages
const githubPagesConfig = {
  ...productionConfig,
  output: 'export', // Siempre generar archivos estáticos para GitHub Pages
  images: {
    unoptimized: true, // No optimizar imágenes para GitHub Pages
  },
  trailingSlash: true, // Añadir barras al final para compatibilidad con GitHub Pages
  assetPrefix: `/${repoName}`, // Ajustar según el nombre de tu repo
  basePath: `/${repoName}`,    // Debe coincidir con el nombre del repositorio
  distDir: 'out',              // Directorio de salida para la compilación
};

// Configuración para Vercel
const vercelConfig = {
  ...productionConfig,
  // Vercel maneja automáticamente la configuración
};

// Configuración para desarrollo local
const developmentConfig = {
  reactStrictMode: false,
  swcMinify: true,
};

// Elegir la configuración adecuada según el entorno
let nextConfig;
if (isGitHubPages) {
  nextConfig = githubPagesConfig;
  console.log('Using GitHub Pages configuration');
} else if (isVercel) {
  nextConfig = vercelConfig;
  console.log('Using Vercel configuration');
} else {
  nextConfig = developmentConfig;
  console.log('Using development configuration');
}

// Configuración de webpack para todos los entornos
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

console.log('Build environment:', process.env.NODE_ENV);
console.log('Build for GitHub Pages:', isGitHubPages);
console.log('Build for Vercel:', isVercel);
console.log('Output mode:', nextConfig.output || 'server');
console.log('Base path:', nextConfig.basePath || 'none');

module.exports = nextConfig; 