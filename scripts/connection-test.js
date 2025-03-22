/**
 * Script para probar la conexión con Supabase desde diferentes entornos
 * Este script se puede ejecutar desde GitHub Actions o localmente
 */
const fetch = require('node-fetch');
const dns = require('dns');
const { promisify } = require('util');

// Promisify DNS lookup
const lookupPromise = promisify(dns.lookup);
const resolveTxtPromise = promisify(dns.resolveTxt);

// Supabase URLs to test
const SUPABASE_URLS = [
  'https://cxfnamwzbfrdaahfsqkc.supabase.co',
  'https://corsproxy.io/?https://cxfnamwzbfrdaahfsqkc.supabase.c',
  'https://api.allorigins.win/raw?url=https://cxfnamwzbfrdaahfsqkc.supabase.co'
];

// Lista de proxy CORS que se pueden usar
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://cors.bridged.cc/',
  'https://thingproxy.freeboard.io/fetch/'
];

// Test de DNS para resolución de dominio
async function testDNS(domain) {
  try {
    console.log(`Verificando resolución DNS para ${domain}...`);
    const { address, family } = await lookupPromise(domain);
    console.log(`✅ ${domain} resuelve a ${address} (IPv${family})`);
    
    // Guardar la dirección IP en un archivo JSON para usarla como fallback
    const fs = require('fs');
    const result = {
      domain,
      ip: address,
      family,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      'public/dns_config.json',
      JSON.stringify(result, null, 2),
      'utf8'
    );
    
    return { success: true, address };
  } catch (error) {
    console.error(`❌ Error al resolver ${domain}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test de conectividad HTTP
async function testHTTPConnection(url) {
  try {
    console.log(`Verificando conexión HTTP a ${url}...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`✅ Conexión exitosa a ${url} (Status: ${response.status})`);
    return { success: true, status: response.status };
  } catch (error) {
    console.error(`❌ Error al conectar con ${url}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test de CORS
async function testCORSProxy(baseUrl, targetUrl) {
  try {
    const proxyUrl = `${baseUrl}${targetUrl}`;
    console.log(`Verificando proxy CORS: ${proxyUrl}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://mique01.github.io'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`✅ Proxy CORS ${baseUrl} funciona correctamente (Status: ${response.status})`);
    return { success: true, status: response.status, proxy: baseUrl };
  } catch (error) {
    console.error(`❌ Error con proxy CORS ${baseUrl}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Prueba completa
async function runTests() {
  // Información del entorno
  console.log('=== INFORMACIÓN DEL ENTORNO ===');
  console.log(`Node.js ${process.version}`);
  console.log(`OS: ${process.platform} ${process.arch}`);
  console.log(`ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`GitHub Actions: ${process.env.GITHUB_ACTIONS || 'false'}`);
  console.log(`Vercel: ${process.env.VERCEL || 'false'}`);
  console.log('============================');
  
  // 1. Test de DNS
  const dnsResult = await testDNS('https://cxfnamwzbfrdaahfsqkc.supabase.co');
  
  // 2. Test de conexión HTTP directa
  console.log('\n=== TEST DE CONEXIÓN DIRECTA ===');
  for (const url of SUPABASE_URLS) {
    await testHTTPConnection(url);
  }
  
  // 3. Test de proxies CORS
  console.log('\n=== TEST DE PROXIES CORS ===');
  const corsResults = [];
  for (const proxy of CORS_PROXIES) {
    const result = await testCORSProxy(proxy, 'https://cxfnamwzbfrdaahfsqkc.supabase.co');
    if (result.success) {
      corsResults.push(result);
    }
  }
  
  // Guardar resultados
  if (corsResults.length > 0) {
    console.log('\n✅ Proxies CORS funcionales encontrados:');
    corsResults.forEach((result, i) => {
      console.log(`${i+1}. ${result.proxy}`);
    });
    
    // Guardar configuración en archivo JSON
    const fs = require('fs');
    fs.writeFileSync(
      'public/cors_config.json',
      JSON.stringify({
        proxies: corsResults.map(r => r.proxy),
        updated: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
      }, null, 2),
      'utf8'
    );
    
    console.log('Configuración guardada en public/cors_config.json');
  } else {
    console.log('\n❌ No se encontraron proxies CORS funcionales');
  }
  
  console.log('\n=== RESUMEN DE TESTS ===');
  console.log(`DNS Resolution: ${dnsResult.success ? '✅ OK' : '❌ ERROR'}`);
  console.log(`HTTP Connection: ${SUPABASE_URLS.some(url => testHTTPConnection(url).success) ? '✅ OK' : '❌ ERROR'}`);
  console.log(`CORS Proxies: ${corsResults.length > 0 ? '✅ OK' : '❌ ERROR'}`);
}

// Ejecutar tests
runTests().catch(error => {
  console.error('Error en las pruebas:', error);
  process.exit(1);
}); 